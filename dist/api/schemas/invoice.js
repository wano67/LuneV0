"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoiceBodySchema = exports.invoiceListSchema = exports.createInvoicePaymentBodySchema = exports.createInvoiceBodySchema = exports.createInvoiceLineBodySchema = exports.dateOnlyStringSchema = exports.invoiceWithItemsAndPaymentsSchema = exports.invoiceWithItemsSchema = exports.invoiceSchema = exports.invoicePaymentSchema = exports.invoiceLineSchema = void 0;
const zod_1 = require("zod");
exports.invoiceLineSchema = zod_1.z.object({
    id: zod_1.z.string(),
    invoiceId: zod_1.z.string(),
    serviceId: zod_1.z.string().nullable(),
    description: zod_1.z.string(),
    quantity: zod_1.z.number(),
    unit: zod_1.z.string().nullable(),
    unitPrice: zod_1.z.number(),
    vatRate: zod_1.z.number().nullable(),
    discountPct: zod_1.z.number().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.invoicePaymentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    invoiceId: zod_1.z.string(),
    amount: zod_1.z.number(),
    paidAt: zod_1.z.string(),
    method: zod_1.z.string().nullable(),
    notes: zod_1.z.string().nullable(),
    transactionId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.invoiceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    businessId: zod_1.z.string(),
    clientId: zod_1.z.string(),
    projectId: zod_1.z.string().nullable(),
    quoteId: zod_1.z.string().nullable(),
    number: zod_1.z.string(),
    status: zod_1.z.string(),
    currency: zod_1.z.string().nullable(),
    issuedAt: zod_1.z.string(),
    dueAt: zod_1.z.string(),
    subtotalAmount: zod_1.z.number(),
    discountAmount: zod_1.z.number(),
    vatAmount: zod_1.z.number(),
    totalAmount: zod_1.z.number(),
    amountPaid: zod_1.z.number(),
    amountDue: zod_1.z.number(),
    notes: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.invoiceWithItemsSchema = zod_1.z.object({
    invoice: exports.invoiceSchema,
    items: zod_1.z.array(exports.invoiceLineSchema),
});
exports.invoiceWithItemsAndPaymentsSchema = zod_1.z.object({
    invoice: exports.invoiceSchema,
    items: zod_1.z.array(exports.invoiceLineSchema),
    payments: zod_1.z.array(exports.invoicePaymentSchema),
});
exports.dateOnlyStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
exports.createInvoiceLineBodySchema = zod_1.z.object({
    serviceId: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().optional(),
    vatRate: zod_1.z.number().nullable().optional(),
});
exports.createInvoiceBodySchema = zod_1.z.object({
    clientId: zod_1.z.string(),
    projectId: zod_1.z.string().nullable().optional(),
    currency: zod_1.z.string().optional(),
    issuedAt: exports.dateOnlyStringSchema.optional(),
    dueAt: exports.dateOnlyStringSchema.optional(),
    notes: zod_1.z.string().nullable().optional(),
    items: zod_1.z.array(exports.createInvoiceLineBodySchema).min(1),
});
exports.createInvoicePaymentBodySchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    accountId: zod_1.z.string().min(1),
    paidAt: exports.dateOnlyStringSchema.optional(),
    method: zod_1.z.string().min(1),
    notes: zod_1.z.string().nullable().optional(),
    label: zod_1.z.string().optional(),
});
exports.invoiceListSchema = zod_1.z.array(exports.invoiceWithItemsSchema);
exports.updateInvoiceBodySchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    dueAt: exports.dateOnlyStringSchema.optional(),
    notes: zod_1.z.string().nullable().optional(),
});
