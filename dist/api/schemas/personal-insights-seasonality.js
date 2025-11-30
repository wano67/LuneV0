"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalSeasonalitySchema = exports.personalSeasonalityPointSchema = void 0;
const zod_1 = require("zod");
exports.personalSeasonalityPointSchema = zod_1.z.object({
    month: zod_1.z.string(), // YYYY-MM
    income: zod_1.z.number(),
    spending: zod_1.z.number(),
    net: zod_1.z.number(),
    zScore: zod_1.z.number(),
    isAnomaly: zod_1.z.boolean(),
});
exports.personalSeasonalitySchema = zod_1.z.object({
    periodMonths: zod_1.z.number(),
    currency: zod_1.z.string(),
    points: zod_1.z.array(exports.personalSeasonalityPointSchema),
    generatedAt: zod_1.z.string(),
});
