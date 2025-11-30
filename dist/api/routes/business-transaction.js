"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessTransactionRoutes = registerBusinessTransactionRoutes;
const zod_1 = require("zod");
const business_transaction_1 = require("@/api/schemas/business-transaction");
const business_transactions_service_1 = require("@/modules/business/business-transactions.service");
const ids_1 = require("@/modules/shared/ids");
const toBusinessTransactionDto = (tx) => ({
    id: tx.id.toString(),
    userId: tx.user_id.toString(),
    businessId: tx.business_id.toString(),
    accountId: tx.account_id.toString(),
    direction: tx.direction,
    amount: Number(tx.amount),
    currency: tx.currency ?? '',
    occurredAt: tx.date.toISOString(),
    label: tx.label,
    category: tx.category_id ? tx.category_id.toString() : null,
    notes: tx.notes ?? null,
    createdAt: tx.created_at.toISOString(),
    updatedAt: tx.updated_at.toISOString(),
});
const parseDateOnlyToUtc = (dateStr) => {
    if (!dateStr)
        return undefined;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
};
async function registerBusinessTransactionRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/businesses/:businessId/transactions',
        schema: {
            tags: ['Business – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            querystring: business_transaction_1.listBusinessTransactionsQuerySchema,
            response: {
                200: zod_1.z.object({ data: business_transaction_1.businessTransactionListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const { accountId, dateFrom, dateTo, direction } = request.query;
            const txs = await business_transactions_service_1.businessTransactionsService.listForBusiness(userId, businessId, {
                accountId: accountId ? (0, ids_1.normalizeAccountId)(BigInt(accountId)) : undefined,
                dateFrom: parseDateOnlyToUtc(dateFrom),
                dateTo: parseDateOnlyToUtc(dateTo),
                direction: direction,
            });
            return reply.send({ data: txs.map(toBusinessTransactionDto) });
        },
    });
    server.route({
        method: 'POST',
        url: '/businesses/:businessId/transactions',
        schema: {
            tags: ['Business – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: business_transaction_1.createBusinessTransactionBodySchema,
            response: {
                201: zod_1.z.object({ data: business_transaction_1.businessTransactionSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const body = request.body;
            const created = await business_transactions_service_1.businessTransactionsService.create({
                userId,
                businessId,
                accountId: BigInt(body.accountId),
                direction: body.direction,
                amount: body.amount,
                occurredAt: parseDateOnlyToUtc(body.occurredAt) ?? new Date(),
                label: body.label,
                category: body.category ?? null,
                notes: body.notes ?? null,
            });
            return reply.code(201).send({ data: toBusinessTransactionDto(created) });
        },
    });
    server.route({
        method: 'GET',
        url: '/businesses/:businessId/transactions/:transactionId',
        schema: {
            tags: ['Business – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), transactionId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: business_transaction_1.businessTransactionSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const txId = (0, ids_1.normalizeTransactionId)(BigInt(request.params.transactionId));
            const tx = await business_transactions_service_1.businessTransactionsService.getForUser(userId, businessId, txId);
            return reply.send({ data: toBusinessTransactionDto(tx) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/businesses/:businessId/transactions/:transactionId',
        schema: {
            tags: ['Business – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), transactionId: zod_1.z.string() }),
            body: business_transaction_1.updateBusinessTransactionBodySchema,
            response: {
                200: zod_1.z.object({ data: business_transaction_1.businessTransactionSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const txId = (0, ids_1.normalizeTransactionId)(BigInt(request.params.transactionId));
            const body = request.body;
            const updated = await business_transactions_service_1.businessTransactionsService.update(userId, businessId, txId, {
                accountId: body.accountId ? BigInt(body.accountId) : undefined,
                direction: body.direction,
                amount: body.amount,
                occurredAt: body.occurredAt ? parseDateOnlyToUtc(body.occurredAt) : undefined,
                label: body.label,
                category: body.category,
                notes: body.notes,
            });
            return reply.send({ data: toBusinessTransactionDto(updated) });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/businesses/:businessId/transactions/:transactionId',
        schema: {
            tags: ['Business – Transactions'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), transactionId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const txId = (0, ids_1.normalizeTransactionId)(BigInt(request.params.transactionId));
            await business_transactions_service_1.businessTransactionsService.delete(userId, businessId, txId);
            return reply.code(204).send(null);
        },
    });
}
