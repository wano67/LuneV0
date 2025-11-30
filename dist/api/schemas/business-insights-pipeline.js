"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessPipelineInsightsSchema = void 0;
const zod_1 = require("zod");
exports.businessPipelineInsightsSchema = zod_1.z.object({
    businessId: zod_1.z.string(),
    quoteCount: zod_1.z.number(),
    acceptedCount: zod_1.z.number(),
    conversionRate: zod_1.z.number(), // 0..1
    avgTimeToAcceptDays: zod_1.z.number(), // 0 si aucun
    totalQuoted: zod_1.z.number(),
    totalAccepted: zod_1.z.number(),
    generatedAt: zod_1.z.string(),
});
