"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusinessBudgetBodySchema = exports.createBusinessBudgetBodySchema = exports.businessBudgetListSchema = exports.businessBudgetSchema = exports.dateOnlyStringSchema = void 0;
const zod_1 = require("zod");
exports.dateOnlyStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
exports.businessBudgetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    businessId: zod_1.z.string(),
    name: zod_1.z.string(),
    currency: zod_1.z.string(),
    amount: zod_1.z.number(),
    periodStart: zod_1.z.string(),
    periodEnd: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.businessBudgetListSchema = zod_1.z.array(exports.businessBudgetSchema);
exports.createBusinessBudgetBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    currency: zod_1.z.string().min(1).default('EUR'),
    amount: zod_1.z.number().positive(),
    periodStart: exports.dateOnlyStringSchema,
    periodEnd: exports.dateOnlyStringSchema,
});
exports.updateBusinessBudgetBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    currency: zod_1.z.string().min(1).optional(),
    amount: zod_1.z.number().positive().optional(),
    periodStart: exports.dateOnlyStringSchema.optional(),
    periodEnd: exports.dateOnlyStringSchema.optional(),
});
