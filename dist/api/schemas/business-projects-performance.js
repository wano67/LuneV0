"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessProjectsPerformanceSchema = void 0;
const zod_1 = require("zod");
exports.businessProjectsPerformanceSchema = zod_1.z.object({
    businessId: zod_1.z.string(),
    totalProjects: zod_1.z.number(),
    completedProjects: zod_1.z.number(),
    onTimeProjects: zod_1.z.number(),
    onTimeRate: zod_1.z.number(), // 0..1
    averageDurationDays: zod_1.z.number(), // 0 if no completed projects
    averageDelayDays: zod_1.z.number(), // moyenne des retards positifs, 0 si aucun
    statusDistribution: zod_1.z.array(zod_1.z.object({
        status: zod_1.z.string(),
        count: zod_1.z.number(),
    })),
    generatedAt: zod_1.z.string(),
});
