"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBusinessTransactionsQuerySchema = exports.updateBusinessTransactionBodySchema = exports.createBusinessTransactionBodySchema = exports.businessTransactionListSchema = exports.businessTransactionSchema = void 0;
const zod_1 = require("zod");
const dateOnlyStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
exports.businessTransactionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    businessId: zod_1.z.string(),
    accountId: zod_1.z.string(),
    direction: zod_1.z.enum(['in', 'out']),
    amount: zod_1.z.number(),
    currency: zod_1.z.string(),
    occurredAt: zod_1.z.string(),
    label: zod_1.z.string(),
    category: zod_1.z.string().nullable(),
    notes: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.businessTransactionListSchema = zod_1.z.array(exports.businessTransactionSchema);
exports.createBusinessTransactionBodySchema = zod_1.z.object({
    accountId: zod_1.z.string(),
    direction: zod_1.z.enum(['in', 'out']),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().optional(),
    occurredAt: dateOnlyStringSchema,
    label: zod_1.z.string().min(1),
    category: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
});
exports.updateBusinessTransactionBodySchema = zod_1.z.object({
    accountId: zod_1.z.string().optional(),
    direction: zod_1.z.enum(['in', 'out']).optional(),
    amount: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().optional(),
    occurredAt: dateOnlyStringSchema.optional(),
    label: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
});
exports.listBusinessTransactionsQuerySchema = zod_1.z.object({
    accountId: zod_1.z.string().optional(),
    dateFrom: dateOnlyStringSchema.optional(),
    dateTo: dateOnlyStringSchema.optional(),
    direction: zod_1.z.enum(['in', 'out']).optional(),
});
