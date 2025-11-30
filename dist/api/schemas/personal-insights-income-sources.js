"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalIncomeSourcesSchema = void 0;
const zod_1 = require("zod");
exports.personalIncomeSourcesSchema = zod_1.z.object({
    period: zod_1.z.object({ from: zod_1.z.string(), to: zod_1.z.string() }),
    currency: zod_1.z.string(),
    sources: zod_1.z.array(zod_1.z.object({
        source: zod_1.z.string(),
        total: zod_1.z.number(),
        transactionCount: zod_1.z.number(),
        shareOfIncome: zod_1.z.number(), // 0-1
        tag: zod_1.z.string().nullable(),
    })),
    topSource: zod_1.z.string().nullable(),
    generatedAt: zod_1.z.string(),
});
