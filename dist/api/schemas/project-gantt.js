"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectGanttOverviewSchema = exports.projectGanttTaskSchema = void 0;
const zod_1 = require("zod");
exports.projectGanttTaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    projectId: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    status: zod_1.z.enum(['todo', 'in_progress', 'blocked', 'done']),
    startDate: zod_1.z.string().nullable(),
    dueDate: zod_1.z.string().nullable(),
    completedAt: zod_1.z.string().nullable(),
    progressPct: zod_1.z.number().min(0).max(100),
    sortIndex: zod_1.z.number(),
    estimatedHours: zod_1.z.number().nullable(),
    actualHours: zod_1.z.number().nullable(),
    parentTaskId: zod_1.z.string().nullable(),
    dependencyIds: zod_1.z.array(zod_1.z.string()),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.projectGanttOverviewSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    name: zod_1.z.string(),
    status: zod_1.z.string(),
    startDate: zod_1.z.string().nullable(),
    dueDate: zod_1.z.string().nullable(),
    completedAt: zod_1.z.string().nullable(),
    progressMode: zod_1.z.string().nullable(),
    progressPct: zod_1.z.number().min(0).max(150),
    totalEstimatedHours: zod_1.z.number(),
    totalActualHours: zod_1.z.number(),
    tasks: zod_1.z.array(exports.projectGanttTaskSchema),
    generatedAt: zod_1.z.string(),
});
