"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalSavingsPlanSchema = exports.personalSavingsPlanQuerySchema = exports.dateOnlyStringSchema = void 0;
const zod_1 = require("zod");
exports.dateOnlyStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
exports.personalSavingsPlanQuerySchema = zod_1.z.object({
    targetAmount: zod_1.z.number().positive(),
    targetDate: exports.dateOnlyStringSchema,
    currentSavings: zod_1.z.number().nonnegative().optional(),
});
exports.personalSavingsPlanSchema = zod_1.z.object({
    baseCurrency: zod_1.z.string(),
    targetAmount: zod_1.z.number(),
    targetDate: zod_1.z.string(),
    today: zod_1.z.string(),
    monthsRemaining: zod_1.z.number(),
    daysRemaining: zod_1.z.number(),
    estimatedMonthlyIncome: zod_1.z.number(),
    estimatedMonthlySpending: zod_1.z.number(),
    estimatedSavingsCapacity: zod_1.z.number(),
    currentBalance: zod_1.z.number(),
    effectiveCurrentSavings: zod_1.z.number(),
    requiredMonthlySavings: zod_1.z.number(),
    requiredDailySavings: zod_1.z.number(),
    requiredSavingsRate: zod_1.z.number(),
    status: zod_1.z.enum(['on_track', 'stretch', 'unrealistic']),
    notes: zod_1.z.array(zod_1.z.string()),
    generatedAt: zod_1.z.string(),
});
