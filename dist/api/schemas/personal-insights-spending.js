"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalSpendingByCategorySchema = void 0;
const zod_1 = require("zod");
exports.personalSpendingByCategorySchema = zod_1.z.object({
    period: zod_1.z.object({ from: zod_1.z.string(), to: zod_1.z.string() }),
    currency: zod_1.z.string(),
    categories: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.string(),
        total: zod_1.z.number(),
        transactionCount: zod_1.z.number(),
        shareOfSpending: zod_1.z.number(),
    })),
    topCategory: zod_1.z.string().nullable(),
    generatedAt: zod_1.z.string(),
});
