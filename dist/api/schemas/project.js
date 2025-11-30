"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectBodySchema = exports.createProjectBodySchema = exports.createProjectServiceItemSchema = exports.projectListSchema = exports.projectSchema = void 0;
const zod_1 = require("zod");
exports.projectSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    businessId: zod_1.z.string().nullable(),
    clientId: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    status: zod_1.z.string(),
    startDate: zod_1.z.string().nullable(),
    dueDate: zod_1.z.string().nullable(),
    completedAt: zod_1.z.string().nullable(),
    budgetAmount: zod_1.z.number().nullable(),
    currency: zod_1.z.string().nullable(),
    priority: zod_1.z.string().nullable(),
    progressManualPct: zod_1.z.number().nullable(),
    progressAutoMode: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.projectListSchema = zod_1.z.array(exports.projectSchema);
exports.createProjectServiceItemSchema = zod_1.z.object({
    serviceId: zod_1.z.string(),
    quantity: zod_1.z.number(),
    customLabel: zod_1.z.string().optional(),
});
exports.createProjectBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().nullable().optional(),
    currency: zod_1.z.string().min(1).nullable().optional(),
    status: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    budgetAmount: zod_1.z.number().nullable().optional(),
    clientId: zod_1.z.string().nullable().optional(),
    services: zod_1.z.array(exports.createProjectServiceItemSchema).optional(),
});
exports.updateProjectBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().nullable().optional(),
    status: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().optional(),
    completedAt: zod_1.z.string().nullable().optional(),
    priority: zod_1.z.string().optional(),
    budgetAmount: zod_1.z.number().nonnegative().nullable().optional(),
    currency: zod_1.z.string().min(1).optional(),
    progressManualPct: zod_1.z.number().min(0).max(100).nullable().optional(),
    progressAutoMode: zod_1.z.string().nullable().optional(),
    clientId: zod_1.z.string().nullable().optional(),
});
