"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectWorkloadOverviewSchema = exports.projectWorkloadPeriodBucketSchema = exports.projectWorkloadStatusBucketSchema = void 0;
const zod_1 = require("zod");
const project_insights_tasks_1 = require("./project-insights-tasks");
exports.projectWorkloadStatusBucketSchema = zod_1.z.object({
    status: zod_1.z.enum(['todo', 'in_progress', 'blocked', 'done']),
    estimatedHours: zod_1.z.number(),
    actualHours: zod_1.z.number(),
});
exports.projectWorkloadPeriodBucketSchema = zod_1.z.object({
    periodKey: zod_1.z.string(),
    periodStart: zod_1.z.string(),
    periodEnd: zod_1.z.string(),
    estimatedHours: zod_1.z.number(),
    actualHours: zod_1.z.number(),
});
exports.projectWorkloadOverviewSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    totalEstimatedHours: zod_1.z.number(),
    totalActualHours: zod_1.z.number(),
    remainingHours: zod_1.z.number(),
    completionRate: zod_1.z.number(),
    granularity: zod_1.z.enum(['week', 'month']),
    rangeStart: zod_1.z.string().nullable(),
    rangeEnd: zod_1.z.string().nullable(),
    byStatus: zod_1.z.array(exports.projectWorkloadStatusBucketSchema),
    byPeriod: zod_1.z.array(exports.projectWorkloadPeriodBucketSchema),
    topByActualHours: zod_1.z.array(project_insights_tasks_1.projectTaskTimeInsightSchema),
    topByOverrun: zod_1.z.array(project_insights_tasks_1.projectTaskTimeInsightSchema),
    generatedAt: zod_1.z.string(),
});
