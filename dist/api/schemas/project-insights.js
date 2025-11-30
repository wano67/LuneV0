"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectInsightsOverviewSchema = exports.projectInsightsGanttRangeSchema = exports.projectInsightsRiskSignalsSchema = exports.projectInsightsRisksSchema = exports.projectInsightsProgressSchema = exports.projectInsightsTaskStatsSchema = void 0;
const zod_1 = require("zod");
exports.projectInsightsTaskStatsSchema = zod_1.z.object({
    total: zod_1.z.number(),
    todo: zod_1.z.number(),
    inProgress: zod_1.z.number(),
    blocked: zod_1.z.number(),
    done: zod_1.z.number(),
});
exports.projectInsightsProgressSchema = zod_1.z.object({
    progressPct: zod_1.z.number(),
    weighted: zod_1.z.boolean(),
});
exports.projectInsightsRisksSchema = zod_1.z.object({
    lateTasks: zod_1.z.number(),
    upcomingDeadlines: zod_1.z.number(),
    nextDeadline: zod_1.z.string().nullable(),
});
exports.projectInsightsRiskSignalsSchema = zod_1.z.object({
    missingDates: zod_1.z.object({
        count: zod_1.z.number(),
        taskIds: zod_1.z.array(zod_1.z.string()),
    }),
    lateTasks: zod_1.z.object({
        count: zod_1.z.number(),
        taskIds: zod_1.z.array(zod_1.z.string()),
    }),
    blockingDependencies: zod_1.z.object({
        count: zod_1.z.number(),
        taskIds: zod_1.z.array(zod_1.z.string()),
    }),
    timeOverruns: zod_1.z.object({
        count: zod_1.z.number(),
        taskIds: zod_1.z.array(zod_1.z.string()),
    }),
});
exports.projectInsightsGanttRangeSchema = zod_1.z.object({
    start: zod_1.z.string().nullable(),
    end: zod_1.z.string().nullable(),
});
exports.projectInsightsOverviewSchema = zod_1.z.object({
    taskStats: exports.projectInsightsTaskStatsSchema,
    progress: exports.projectInsightsProgressSchema,
    risks: exports.projectInsightsRisksSchema,
    ganttRange: exports.projectInsightsGanttRangeSchema,
    riskSignals: exports.projectInsightsRiskSignalsSchema,
    generatedAt: zod_1.z.string(),
});
