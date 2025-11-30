"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalScoreSchema = void 0;
const zod_1 = require("zod");
exports.personalScoreSchema = zod_1.z.object({
    score: zod_1.z.number(),
    grade: zod_1.z.string(),
    explanation: zod_1.z.array(zod_1.z.string()),
    inputs: zod_1.z.object({
        savingsRate: zod_1.z.number(),
        volatility: zod_1.z.number(),
        monthsInRed: zod_1.z.number(),
        periodMonths: zod_1.z.number(),
    }),
    generatedAt: zod_1.z.string(),
});
