"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalTransactionRoutes = registerPersonalTransactionRoutes;
const zod_1 = require("zod");
const personal_transaction_1 = require("@/api/schemas/personal-transaction");
const personal_transactions_service_1 = require("@/modules/personal/personal-transactions.service");
const ids_1 = require("@/modules/shared/ids");
const parseDateOnly = (value) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined);
const toTransactionDto = (tx) => ({
    id: tx.id.toString(),
    userId: tx.user_id.toString(),
    accountId: tx.account_id.toString(),
    direction: tx.direction,
    amount: Number(tx.amount ?? tx.amount),
    currency: tx.currency ?? '',
    occurredAt: tx.date.toISOString(),
    label: tx.label,
    category: tx.notes ?? null,
    notes: tx.notes ?? null,
    createdAt: tx.created_at.toISOString(),
    updatedAt: tx.updated_at.toISOString(),
});
async function registerPersonalTransactionRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/personal/transactions',
        schema: {
            tags: ['Personal – Transactions'],
            security: [{ bearerAuth: [] }],
            querystring: personal_transaction_1.listPersonalTransactionsQuerySchema,
            response: {
                200: zod_1.z.object({ data: personal_transaction_1.personalTransactionListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const { accountId, dateFrom, dateTo, direction, category } = request.query;
            const txs = await personal_transactions_service_1.personalTransactionsService.list(userId, {
                accountId: accountId ? (0, ids_1.normalizeAccountId)(BigInt(accountId)) : undefined,
                dateFrom: parseDateOnly(dateFrom),
                dateTo: parseDateOnly(dateTo),
                direction: direction,
                category: category,
            });
            return reply.send({ data: txs.map(toTransactionDto) });
        },
    });
    server.route({
        method: 'POST',
        url: '/personal/transactions',
        schema: {
            tags: ['Personal – Transactions'],
            security: [{ bearerAuth: [] }],
            body: personal_transaction_1.createPersonalTransactionBodySchema,
            response: {
                201: zod_1.z.object({ data: personal_transaction_1.personalTransactionSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const body = request.body;
            const created = await personal_transactions_service_1.personalTransactionsService.create({
                userId,
                accountId: BigInt(body.accountId),
                direction: body.direction,
                amount: body.amount,
                occurredAt: parseDateOnly(body.occurredAt) ?? new Date(),
                label: body.label,
                category: body.category,
                notes: body.notes,
            });
            return reply.code(201).send({ data: toTransactionDto(created) });
        },
    });
    server.route({
        method: 'GET',
        url: '/personal/transactions/:transactionId',
        schema: {
            tags: ['Personal – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ transactionId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: personal_transaction_1.personalTransactionSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const tx = await personal_transactions_service_1.personalTransactionsService.getById(userId, (0, ids_1.normalizeTransactionId)(BigInt(request.params.transactionId)));
            return reply.send({ data: toTransactionDto(tx) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/personal/transactions/:transactionId',
        schema: {
            tags: ['Personal – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ transactionId: zod_1.z.string() }),
            body: personal_transaction_1.updatePersonalTransactionBodySchema,
            response: {
                200: zod_1.z.object({ data: personal_transaction_1.personalTransactionSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const txId = (0, ids_1.normalizeTransactionId)(BigInt(request.params.transactionId));
            const body = request.body;
            const updated = await personal_transactions_service_1.personalTransactionsService.update(userId, txId, {
                direction: body.direction,
                amount: body.amount,
                occurredAt: body.occurredAt ? parseDateOnly(body.occurredAt) : undefined,
                label: body.label,
                category: body.category,
                notes: body.notes,
            });
            return reply.send({ data: toTransactionDto(updated) });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/personal/transactions/:transactionId',
        schema: {
            tags: ['Personal – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ transactionId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const txId = (0, ids_1.normalizeTransactionId)(BigInt(request.params.transactionId));
            await personal_transactions_service_1.personalTransactionsService.delete(userId, txId);
            return reply.code(204).send(null);
        },
    });
}
