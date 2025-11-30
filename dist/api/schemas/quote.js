"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuoteBodySchema = exports.createQuoteBodySchema = exports.dateOnlyStringSchema = exports.createQuoteLineInputSchema = exports.quoteListSchema = exports.quoteWithItemsSchema = exports.quoteSchema = exports.quoteLineSchema = void 0;
const zod_1 = require("zod");
exports.quoteLineSchema = zod_1.z.object({
    id: zod_1.z.string(),
    quoteId: zod_1.z.string(),
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
exports.quoteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    businessId: zod_1.z.string(),
    clientId: zod_1.z.string(),
    projectId: zod_1.z.string().nullable(),
    quoteNumber: zod_1.z.string(),
    status: zod_1.z.string(),
    title: zod_1.z.string().nullable(),
    currency: zod_1.z.string(),
    subtotalHt: zod_1.z.number(),
    discountTotal: zod_1.z.number(),
    vatTotal: zod_1.z.number(),
    totalHt: zod_1.z.number(),
    totalTtc: zod_1.z.number(),
    validUntil: zod_1.z.string().nullable(),
    notes: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.quoteWithItemsSchema = zod_1.z.object({
    quote: exports.quoteSchema,
    items: zod_1.z.array(exports.quoteLineSchema),
});
exports.quoteListSchema = zod_1.z.array(exports.quoteWithItemsSchema);
exports.createQuoteLineInputSchema = zod_1.z.object({
    serviceId: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().optional(),
    vatRate: zod_1.z.number().nullable().optional(),
});
exports.dateOnlyStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
exports.createQuoteBodySchema = zod_1.z.object({
    clientId: zod_1.z.string(),
    projectId: zod_1.z.string().nullable().optional(),
    title: zod_1.z.string().optional(),
    currency: zod_1.z.string().optional(),
    validUntil: exports.dateOnlyStringSchema.optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.createQuoteLineInputSchema).min(1),
});
exports.updateQuoteBodySchema = zod_1.z.object({
    status: zod_1.z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
    notes: zod_1.z.string().nullable().optional(),
    issueDate: exports.dateOnlyStringSchema.optional(),
    validUntil: exports.dateOnlyStringSchema.nullable().optional(),
    items: zod_1.z.array(exports.createQuoteLineInputSchema).min(1).optional(),
});
