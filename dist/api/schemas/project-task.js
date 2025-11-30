"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectTaskBodySchema = exports.createProjectTaskBodySchema = exports.projectTaskListSchema = exports.projectTaskSchema = exports.dateOnlyStringSchema = void 0;
const zod_1 = require("zod");
exports.dateOnlyStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
exports.projectTaskSchema = zod_1.z.object({
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
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.projectTaskListSchema = zod_1.z.array(exports.projectTaskSchema);
exports.createProjectTaskBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
    startDate: exports.dateOnlyStringSchema.nullable().optional(),
    dueDate: exports.dateOnlyStringSchema.nullable().optional(),
    progressPct: zod_1.z.number().min(0).max(100).optional(),
    sortIndex: zod_1.z.number().optional(),
    estimatedHours: zod_1.z.number().nonnegative().nullable().optional(),
});
exports.updateProjectTaskBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
    startDate: exports.dateOnlyStringSchema.nullable().optional(),
    dueDate: exports.dateOnlyStringSchema.nullable().optional(),
    completedAt: exports.dateOnlyStringSchema.nullable().optional(),
    progressPct: zod_1.z.number().min(0).max(100).optional(),
    sortIndex: zod_1.z.number().optional(),
    estimatedHours: zod_1.z.number().nonnegative().nullable().optional(),
    actualHours: zod_1.z.number().nonnegative().nullable().optional(),
});
