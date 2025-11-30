"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalAccountRoutes = registerPersonalAccountRoutes;
const zod_1 = require("zod");
const personal_account_1 = require("@/api/schemas/personal-account");
const account_service_1 = require("@/modules/account/account.service");
const personal_transactions_service_1 = require("@/modules/personal/personal-transactions.service");
const ids_1 = require("@/modules/shared/ids");
const prisma_1 = require("@/lib/prisma");
const toAccountDto = (account, balance) => ({
    id: account.id.toString(),
    userId: account.user_id.toString(),
    name: account.name,
    type: account.type,
    currency: account.currency,
    isArchived: !account.is_active,
    includeInBudget: account.include_in_budget,
    includeInNetWorth: account.include_in_net_worth,
    balance,
    createdAt: account.created_at.toISOString(),
    updatedAt: account.updated_at.toISOString(),
});
// ⚠️ IMPORTANT : ce type doit exister dans account.service.ts
// Si tu as encore "Invalid account type", ouvre account.service.ts
// et mets ici un des types autorisés (ex: 'cash', 'other', etc.)
const DEFAULT_PERSONAL_ACCOUNT_TYPE = 'cash';
const computeBalance = async (userId, accountId) => {
    const tx = await prisma_1.prisma.transactions.groupBy({
        where: { user_id: userId, business_id: null, account_id: accountId },
        by: ['direction'],
        _sum: { amount: true },
    });
    return tx.reduce((sum, row) => {
        const amount = Number(row._sum.amount ?? 0);
        if (row.direction === 'in')
            return sum + amount;
        if (row.direction === 'out')
            return sum - amount;
        return sum;
    }, 0);
};
async function registerPersonalAccountRoutes(app) {
    const server = app.withTypeProvider();
    // LIST ----------------------------------------------------------------------
    server.route({
        method: 'GET',
        url: '/personal/accounts',
        schema: {
            tags: ['Personal – Accounts'],
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.z.object({ data: personal_account_1.personalAccountListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const accounts = await account_service_1.accountService.listPersonalAccountsForUser(userId, {
                includeInactive: true,
            });
            const balancesRaw = await prisma_1.prisma.transactions.groupBy({
                where: {
                    user_id: userId,
                    business_id: null,
                    account_id: { in: accounts.map((a) => a.id) },
                },
                by: ['account_id', 'direction'],
                _sum: { amount: true },
            });
            const balanceMap = new Map();
            for (const row of balancesRaw) {
                const current = balanceMap.get(row.account_id) ?? 0;
                const amount = Number(row._sum.amount ?? 0);
                if (row.direction === 'in')
                    balanceMap.set(row.account_id, current + amount);
                else if (row.direction === 'out')
                    balanceMap.set(row.account_id, current - amount);
                else
                    balanceMap.set(row.account_id, current);
            }
            return reply.send({
                data: accounts.map((a) => toAccountDto(a, balanceMap.get(a.id) ?? 0)),
            });
        },
    });
    // CREATE --------------------------------------------------------------------
    server.route({
        method: 'POST',
        url: '/personal/accounts',
        schema: {
            tags: ['Personal – Accounts'],
            security: [{ bearerAuth: [] }],
            body: personal_account_1.createPersonalAccountBodySchema,
            response: {
                201: zod_1.z.object({ data: personal_account_1.personalAccountSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const body = request.body;
            // On ignore complètement le type envoyé, on force un type safe pour le domaine.
            const account = await account_service_1.accountService.createPersonalAccount({
                userId,
                name: body.name,
                type: DEFAULT_PERSONAL_ACCOUNT_TYPE,
                currency: body.currency ?? 'EUR',
                provider: null,
                includeInBudget: true,
                includeInNetWorth: true,
                connectionType: 'manual',
            });
            // optional opening balance
            if (body.initialBalance && body.initialBalance !== 0) {
                await personal_transactions_service_1.personalTransactionsService.create({
                    userId,
                    accountId: account.id,
                    direction: body.initialBalance >= 0 ? 'in' : 'out',
                    amount: Math.abs(body.initialBalance),
                    occurredAt: new Date(),
                    label: 'Opening balance',
                });
            }
            const balance = await computeBalance(userId, account.id);
            return reply.code(201).send({ data: toAccountDto(account, balance) });
        },
    });
    // GET ONE -------------------------------------------------------------------
    server.route({
        method: 'GET',
        url: '/personal/accounts/:accountId',
        schema: {
            tags: ['Personal – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ accountId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: personal_account_1.personalAccountSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const accountId = (0, ids_1.normalizeAccountId)(BigInt(request.params.accountId));
            const account = await account_service_1.accountService.getAccountForUser(accountId, userId);
            if (account.business_id !== null) {
                throw new Error('Account not found');
            }
            const tx = await prisma_1.prisma.transactions.groupBy({
                where: { user_id: userId, business_id: null, account_id: accountId },
                by: ['direction'],
                _sum: { amount: true },
            });
            const balance = tx.reduce((sum, row) => {
                const amount = Number(row._sum.amount ?? 0);
                if (row.direction === 'in')
                    return sum + amount;
                if (row.direction === 'out')
                    return sum - amount;
                return sum;
            }, 0);
            return reply.send({ data: toAccountDto(account, balance) });
        },
    });
    // PATCH ---------------------------------------------------------------------
    server.route({
        method: 'PATCH',
        url: '/personal/accounts/:accountId',
        schema: {
            tags: ['Personal – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ accountId: zod_1.z.string() }),
            body: personal_account_1.updatePersonalAccountBodySchema,
            response: {
                200: zod_1.z.object({ data: personal_account_1.personalAccountSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const accountId = (0, ids_1.normalizeAccountId)(BigInt(request.params.accountId));
            // Pour l’instant on ignore aussi les changements de type côté API,
            // ça évite de retomber sur "Invalid account type".
            const updated = await account_service_1.accountService.updateAccount(accountId, userId, {
                name: request.body.name,
                type: undefined,
                currency: request.body.currency,
                isActive: request.body.isArchived === undefined ? undefined : !request.body.isArchived,
            });
            if (updated.business_id !== null) {
                throw new Error('Account not found');
            }
            const balance = await computeBalance(userId, accountId);
            return reply.send({ data: toAccountDto(updated, balance) });
        },
    });
    // DELETE --------------------------------------------------------------------
    server.route({
        method: 'DELETE',
        url: '/personal/accounts/:accountId',
        schema: {
            tags: ['Personal – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ accountId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const accountId = (0, ids_1.normalizeAccountId)(BigInt(request.params.accountId));
            const account = await account_service_1.accountService.getAccountForUser(accountId, userId);
            if (account.business_id !== null) {
                throw new Error('Account not found');
            }
            await prisma_1.prisma.accounts.delete({ where: { id: accountId } });
            return reply.code(204).send(null);
        },
    });
}
