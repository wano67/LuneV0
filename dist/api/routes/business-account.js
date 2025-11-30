"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessAccountRoutes = registerBusinessAccountRoutes;
const zod_1 = require("zod");
const business_account_1 = require("@/api/schemas/business-account");
const account_service_1 = require("@/modules/account/account.service");
const business_transactions_service_1 = require("@/modules/business/business-transactions.service");
const ids_1 = require("@/modules/shared/ids");
const prisma_1 = require("@/lib/prisma");
const toBusinessAccountDto = (account) => ({
    id: account.id.toString(),
    userId: account.user_id.toString(),
    businessId: account.business_id.toString(),
    name: account.name,
    type: account.type,
    currency: account.currency,
    isArchived: !account.is_active,
    createdAt: account.created_at.toISOString(),
    updatedAt: account.updated_at.toISOString(),
});
async function registerBusinessAccountRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/businesses/:businessId/accounts',
        schema: {
            tags: ['Business – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: business_account_1.businessAccountListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const accounts = await account_service_1.accountService.listBusinessAccountsForUser(userId, businessId, { includeInactive: true });
            return reply.send({ data: accounts.map(toBusinessAccountDto) });
        },
    });
    server.route({
        method: 'POST',
        url: '/businesses/:businessId/accounts',
        schema: {
            tags: ['Business – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: business_account_1.createBusinessAccountBodySchema,
            response: {
                201: zod_1.z.object({ data: business_account_1.businessAccountSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const body = request.body;
            const account = await account_service_1.accountService.createBusinessAccount({
                userId,
                businessId,
                name: body.name,
                type: body.type,
                currency: body.currency,
                provider: null,
                includeInBudget: true,
                includeInNetWorth: true,
                connectionType: 'manual',
            });
            if (body.initialBalance && body.initialBalance !== 0) {
                await business_transactions_service_1.businessTransactionsService.create({
                    userId,
                    businessId,
                    accountId: account.id,
                    direction: body.initialBalance >= 0 ? 'in' : 'out',
                    amount: Math.abs(body.initialBalance),
                    occurredAt: new Date(),
                    label: 'Opening balance',
                });
            }
            return reply.code(201).send({ data: toBusinessAccountDto(account) });
        },
    });
    server.route({
        method: 'GET',
        url: '/businesses/:businessId/accounts/:accountId',
        schema: {
            tags: ['Business – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), accountId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: business_account_1.businessAccountSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const accountId = (0, ids_1.normalizeAccountId)(BigInt(request.params.accountId));
            const account = await account_service_1.accountService.getAccountForUser(accountId, userId);
            if (account.business_id !== businessId) {
                throw new Error('Account not found');
            }
            return reply.send({ data: toBusinessAccountDto(account) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/businesses/:businessId/accounts/:accountId',
        schema: {
            tags: ['Business – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), accountId: zod_1.z.string() }),
            body: business_account_1.updateBusinessAccountBodySchema,
            response: {
                200: zod_1.z.object({ data: business_account_1.businessAccountSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const accountId = (0, ids_1.normalizeAccountId)(BigInt(request.params.accountId));
            const updated = await account_service_1.accountService.updateAccount(accountId, userId, {
                name: request.body.name,
                type: request.body.type,
                currency: request.body.currency,
                isActive: request.body.isArchived === undefined ? undefined : !request.body.isArchived,
            });
            if (updated.business_id !== businessId) {
                throw new Error('Account not found');
            }
            return reply.send({ data: toBusinessAccountDto(updated) });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/businesses/:businessId/accounts/:accountId',
        schema: {
            tags: ['Business – Accounts'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), accountId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const accountId = (0, ids_1.normalizeAccountId)(BigInt(request.params.accountId));
            const account = await account_service_1.accountService.getAccountForUser(accountId, userId);
            if (account.business_id !== businessId) {
                throw new Error('Account not found');
            }
            await prisma_1.prisma.accounts.delete({ where: { id: accountId } });
            return reply.code(204).send(null);
        },
    });
}
