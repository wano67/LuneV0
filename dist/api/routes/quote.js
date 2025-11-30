"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerQuoteRoutes = registerQuoteRoutes;
const zod_1 = require("zod");
const quote_1 = require("@/api/schemas/quote");
const quote_service_1 = require("@/modules/quote/quote.service");
const ids_1 = require("@/modules/shared/ids");
const prisma_1 = require("@/lib/prisma");
const parseDateOnly = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    return new Date(`${value}T00:00:00.000Z`);
};
const decimalToNumber = (value) => {
    if (value === null)
        return 0;
    return typeof value === 'number' ? value : value.toNumber();
};
const toQuoteDto = (quote, userId) => ({
    id: quote.id.toString(),
    userId: userId ? userId.toString() : quote.user_id ? quote.user_id.toString() : '',
    businessId: quote.business_id.toString(),
    clientId: quote.client_id.toString(),
    projectId: quote.project_id ? quote.project_id.toString() : null,
    quoteNumber: quote.quote_number,
    status: quote.status,
    title: quote.title ?? null,
    currency: quote.currency ?? '',
    subtotalHt: decimalToNumber(quote.subtotal_ht),
    discountTotal: decimalToNumber(quote.discount_total),
    vatTotal: decimalToNumber(quote.vat_total),
    totalHt: decimalToNumber(quote.total_ht),
    totalTtc: decimalToNumber(quote.total_ttc),
    validUntil: quote.valid_until ? quote.valid_until.toISOString() : null,
    notes: quote.notes ?? null,
    createdAt: quote.created_at.toISOString(),
    updatedAt: quote.updated_at.toISOString(),
});
const toQuoteLineDto = (line) => ({
    id: line.id.toString(),
    quoteId: line.quote_id.toString(),
    serviceId: line.service_id ? line.service_id.toString() : null,
    description: line.description,
    quantity: decimalToNumber(line.quantity),
    unit: line.unit ?? null,
    unitPrice: decimalToNumber(line.unit_price),
    vatRate: line.vat_rate !== null ? decimalToNumber(line.vat_rate) : null,
    discountPct: line.discount_pct !== null ? decimalToNumber(line.discount_pct) : null,
    createdAt: line.created_at.toISOString(),
    updatedAt: line.updated_at.toISOString(),
});
const toQuoteWithItemsDto = (quote, userId) => ({
    quote: toQuoteDto(quote, userId),
    items: (quote.quote_lines ?? []).map(toQuoteLineDto),
});
async function loadQuoteWithItems(userId, businessId, quoteId) {
    const full = await quote_service_1.quotesService.getQuoteById(userId, businessId, quoteId);
    return toQuoteWithItemsDto(full, userId);
}
async function registerQuoteRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'POST',
        url: '/api/v1/businesses/:businessId/quotes',
        schema: {
            tags: ['Business – Quotes'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: quote_1.createQuoteBodySchema,
            response: {
                201: zod_1.z.object({ data: quote_1.quoteWithItemsSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const body = request.body;
            const items = body.items.map((item) => ({
                serviceId: item.serviceId ? BigInt(item.serviceId) : undefined,
                description: item.description ?? 'Service',
                quantity: item.quantity,
                unitPrice: item.unitPrice ?? 0,
                vatRate: item.vatRate ?? 0,
            }));
            const created = await quote_service_1.quotesService.createQuote({
                userId,
                businessId,
                clientId: BigInt(body.clientId),
                projectId: body.projectId ? BigInt(body.projectId) : null,
                currency: body.currency ?? 'EUR',
                items,
                issueDate: new Date(),
                expiryDate: parseDateOnly(body.validUntil) ?? undefined,
                notes: body.notes ?? null,
            });
            const data = await loadQuoteWithItems(userId, businessId, created.id);
            return reply.code(201).send({ data });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/quotes',
        schema: {
            tags: ['Business – Quotes'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: quote_1.quoteListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const quotes = await quote_service_1.quotesService.listQuotesForBusiness(userId, businessId);
            const withItems = await Promise.all(quotes.map((q) => loadQuoteWithItems(userId, businessId, q.id)));
            return reply.send({ data: withItems });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/quotes/:quoteId',
        schema: {
            tags: ['Business – Quotes'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ quoteId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: quote_1.quoteWithItemsSchema }),
                404: zod_1.z.object({ error: zod_1.z.object({ code: zod_1.z.string(), message: zod_1.z.string() }) }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const quoteId = BigInt(request.params.quoteId);
            const record = await prisma_1.prisma.quotes.findUnique({
                where: { id: quoteId },
                select: { business_id: true },
            });
            if (!record) {
                return reply.code(404).send({ error: { code: 'quote_not_found', message: 'Quote not found' } });
            }
            const data = await loadQuoteWithItems(userId, record.business_id, quoteId);
            return reply.send({ data });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/api/v1/quotes/:quoteId',
        schema: {
            tags: ['Business – Quotes'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ quoteId: zod_1.z.string() }),
            body: quote_1.updateQuoteBodySchema,
            response: {
                200: zod_1.z.object({ data: quote_1.quoteWithItemsSchema }),
                404: zod_1.z.object({ error: zod_1.z.object({ code: zod_1.z.string(), message: zod_1.z.string() }) }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const quoteId = BigInt(request.params.quoteId);
            const body = request.body;
            const record = await prisma_1.prisma.quotes.findUnique({
                where: { id: quoteId },
                select: { business_id: true },
            });
            if (!record) {
                return reply.code(404).send({ error: { code: 'quote_not_found', message: 'Quote not found' } });
            }
            const items = body.items
                ? body.items.map((item) => ({
                    serviceId: item.serviceId ? BigInt(item.serviceId) : undefined,
                    description: item.description ?? 'Service',
                    quantity: item.quantity,
                    unitPrice: item.unitPrice ?? 0,
                    vatRate: item.vatRate ?? 0,
                }))
                : undefined;
            await quote_service_1.quotesService.updateQuote(quoteId, userId, record.business_id, {
                status: body.status,
                notes: body.notes,
                issueDate: parseDateOnly(body.issueDate) ?? undefined,
                expiryDate: parseDateOnly(body.validUntil),
                items,
            });
            const data = await loadQuoteWithItems(userId, record.business_id, quoteId);
            return reply.send({ data });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/api/v1/quotes/:quoteId',
        schema: {
            tags: ['Business – Quotes'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ quoteId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
                404: zod_1.z.object({ error: zod_1.z.object({ code: zod_1.z.string(), message: zod_1.z.string() }) }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const quoteId = BigInt(request.params.quoteId);
            const record = await prisma_1.prisma.quotes.findUnique({
                where: { id: quoteId },
                select: { business_id: true },
            });
            if (!record) {
                return reply.code(404).send({ error: { code: 'quote_not_found', message: 'Quote not found' } });
            }
            await quote_service_1.quotesService.deleteQuote(quoteId, userId, record.business_id);
            return reply.code(204).send(null);
        },
    });
    server.route({
        method: 'POST',
        url: '/api/v1/quotes/:quoteId/accept',
        schema: {
            tags: ['Business – Quotes'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ quoteId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: quote_1.quoteSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const quoteId = BigInt(request.params.quoteId);
            const updated = await quote_service_1.quotesService.updateQuoteStatus(quoteId, userId, 'accepted');
            return reply.send({ data: toQuoteDto(updated, userId) });
        },
    });
    server.route({
        method: 'POST',
        url: '/api/v1/quotes/:quoteId/invoices',
        schema: {
            tags: ['Business – Quotes'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ quoteId: zod_1.z.string() }),
            response: {
                201: zod_1.z.object({ data: zod_1.z.object({ invoiceId: zod_1.z.string() }) }),
                404: zod_1.z.object({ error: zod_1.z.object({ code: zod_1.z.string(), message: zod_1.z.string() }) }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const quoteId = BigInt(request.params.quoteId);
            const record = await prisma_1.prisma.quotes.findUnique({
                where: { id: quoteId },
                select: { business_id: true },
            });
            if (!record) {
                return reply.code(404).send({ error: { code: 'quote_not_found', message: 'Quote not found' } });
            }
            const invoice = await quote_service_1.quotesService.convertAcceptedQuoteToInvoice({
                userId,
                businessId: record.business_id,
                quoteId,
                type: 'full',
            });
            return reply.code(201).send({ data: { invoiceId: invoice.id.toString() } });
        },
    });
}
