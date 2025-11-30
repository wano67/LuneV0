"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInvoiceRoutes = registerInvoiceRoutes;
const zod_1 = require("zod");
const invoice_1 = require("@/api/schemas/invoice");
const invoice_service_1 = require("@/modules/invoice/invoice.service");
const invoice_payment_service_1 = require("@/modules/invoice-payment/invoice-payment.service");
const ids_1 = require("@/modules/shared/ids");
const prisma_1 = require("@/lib/prisma");
const parseDateOnly = (value) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined);
const decimalToNumber = (value) => {
    if (value === null)
        return 0;
    return typeof value === 'number' ? value : value.toNumber();
};
const toInvoiceDto = (invoice) => ({
    id: invoice.id.toString(),
    businessId: invoice.business_id.toString(),
    clientId: invoice.client_id.toString(),
    projectId: invoice.project_id ? invoice.project_id.toString() : null,
    quoteId: invoice.quote_id ? invoice.quote_id.toString() : null,
    number: invoice.invoice_number,
    status: invoice.status,
    currency: invoice.currency ?? '',
    issuedAt: invoice.invoice_date.toISOString(),
    dueAt: invoice.due_date.toISOString(),
    subtotalAmount: decimalToNumber(invoice.subtotal_ht),
    discountAmount: decimalToNumber(invoice.discount_total),
    vatAmount: decimalToNumber(invoice.vat_total),
    totalAmount: decimalToNumber(invoice.total_ttc),
    amountPaid: decimalToNumber(invoice.amount_paid_cached),
    amountDue: decimalToNumber(invoice.total_ttc) - decimalToNumber(invoice.amount_paid_cached),
    notes: invoice.notes ?? null,
    createdAt: invoice.created_at.toISOString(),
    updatedAt: invoice.updated_at.toISOString(),
});
const toInvoiceLineDto = (line) => ({
    id: line.id.toString(),
    invoiceId: line.invoice_id.toString(),
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
const toInvoicePaymentDto = (payment) => ({
    id: payment.id.toString(),
    invoiceId: payment.invoice_id.toString(),
    amount: decimalToNumber(payment.amount),
    paidAt: payment.paid_at.toISOString(),
    method: payment.method ?? null,
    notes: payment.notes ?? null,
    transactionId: payment.transaction_id ? payment.transaction_id.toString() : null,
    createdAt: payment.created_at.toISOString(),
    updatedAt: payment.updated_at.toISOString(),
});
const toInvoiceWithItemsDto = (data) => ({
    invoice: toInvoiceDto(data.invoice ?? data),
    items: (data.items ?? data.invoice_lines ?? []).map(toInvoiceLineDto),
});
const toInvoiceWithItemsAndPaymentsDto = (data) => ({
    invoice: toInvoiceDto(data.invoice ?? data),
    items: (data.items ?? data.invoice_lines ?? []).map(toInvoiceLineDto),
    payments: (data.payments ?? data.invoice_payments ?? []).map(toInvoicePaymentDto),
});
async function registerInvoiceRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'POST',
        url: '/api/v1/businesses/:businessId/invoices',
        schema: {
            tags: ['Business – Invoices'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: invoice_1.createInvoiceBodySchema,
            response: {
                201: zod_1.z.object({ data: invoice_1.invoiceWithItemsSchema }),
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
            const created = await invoice_service_1.invoiceService.createInvoice({
                userId,
                businessId,
                clientId: BigInt(body.clientId),
                projectId: body.projectId ? BigInt(body.projectId) : null,
                currency: body.currency,
                issuedAt: parseDateOnly(body.issuedAt),
                dueAt: parseDateOnly(body.dueAt),
                notes: body.notes ?? undefined,
                items,
            });
            return reply.code(201).send({ data: toInvoiceWithItemsDto(created) });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/invoices',
        schema: {
            tags: ['Business – Invoices'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: invoice_1.invoiceListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const invoices = await invoice_service_1.invoiceService.listInvoicesForBusiness({ userId, businessId });
            return reply.send({ data: invoices.map(toInvoiceWithItemsDto) });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/invoices/:invoiceId',
        schema: {
            tags: ['Business – Invoices'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ invoiceId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: invoice_1.invoiceWithItemsAndPaymentsSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const invoiceId = BigInt(request.params.invoiceId);
            const full = await invoice_service_1.invoiceService.getInvoiceWithItemsForUser({ userId, invoiceId });
            return reply.send({ data: toInvoiceWithItemsAndPaymentsDto({
                    invoice: full.invoice,
                    items: full.items,
                    payments: full.payments,
                }) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/api/v1/invoices/:invoiceId',
        schema: {
            tags: ['Business – Invoices'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ invoiceId: zod_1.z.string() }),
            body: invoice_1.updateInvoiceBodySchema,
            response: {
                200: zod_1.z.object({ data: invoice_1.invoiceWithItemsAndPaymentsSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const invoiceId = BigInt(request.params.invoiceId);
            const body = request.body;
            const updated = await invoice_service_1.invoiceService.updateInvoice({
                userId,
                invoiceId,
                status: body.status,
                dueAt: parseDateOnly(body.dueAt),
                notes: body.notes,
            });
            return reply.send({
                data: toInvoiceWithItemsAndPaymentsDto({
                    invoice: updated.invoice,
                    items: updated.items,
                    payments: updated.payments,
                }),
            });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/api/v1/invoices/:invoiceId',
        schema: {
            tags: ['Business – Invoices'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ invoiceId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const invoiceId = BigInt(request.params.invoiceId);
            await invoice_service_1.invoiceService.deleteInvoice({ userId, invoiceId });
            return reply.code(204).send(null);
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/invoices/:invoiceId/payments',
        schema: {
            tags: ['Business – Payments'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ invoiceId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: zod_1.z.array(invoice_1.invoicePaymentSchema) }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const invoiceId = BigInt(request.params.invoiceId);
            const payments = await invoice_payment_service_1.invoicePaymentService.listPaymentsForInvoice({ userId, invoiceId });
            return reply.send({ data: payments.map(toInvoicePaymentDto) });
        },
    });
    server.route({
        method: 'POST',
        url: '/api/v1/invoices/:invoiceId/payments',
        schema: {
            tags: ['Business – Payments'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ invoiceId: zod_1.z.string() }),
            body: invoice_1.createInvoicePaymentBodySchema,
            response: {
                201: zod_1.z.object({ data: invoice_1.invoiceWithItemsAndPaymentsSchema }),
                404: zod_1.z.object({ error: zod_1.z.object({ code: zod_1.z.string(), message: zod_1.z.string() }) }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const invoiceId = BigInt(request.params.invoiceId);
            const body = request.body;
            const invoiceRecord = await prisma_1.prisma.invoices.findUnique({
                where: { id: invoiceId },
                select: { business_id: true },
            });
            if (!invoiceRecord) {
                return reply.code(404).send({ error: { code: 'invoice_not_found', message: 'Invoice not found' } });
            }
            const paidAt = body.paidAt ? new Date(`${body.paidAt}T00:00:00.000Z`) : new Date();
            const result = await invoice_payment_service_1.invoicePaymentService.registerInvoicePayment({
                userId,
                businessId: invoiceRecord.business_id,
                accountId: BigInt(body.accountId),
                invoiceId,
                amount: body.amount,
                date: paidAt,
                label: body.label,
                method: body.method,
                notes: body.notes ?? undefined,
            });
            const full = await invoice_service_1.invoiceService.getInvoiceWithItemsForUser({ userId, invoiceId });
            return reply.code(201).send({
                data: toInvoiceWithItemsAndPaymentsDto({
                    invoice: full.invoice,
                    items: full.items,
                    payments: full.payments,
                }),
            });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/api/v1/invoices/:invoiceId/payments/:paymentId',
        schema: {
            tags: ['Business – Payments'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ invoiceId: zod_1.z.string(), paymentId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const invoiceId = BigInt(request.params.invoiceId);
            const paymentId = BigInt(request.params.paymentId);
            await invoice_payment_service_1.invoicePaymentService.deleteInvoicePayment({ userId, invoiceId, paymentId });
            return reply.code(204).send(null);
        },
    });
}
