"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceBodySchema = exports.createServiceBodySchema = exports.serviceListSchema = exports.serviceSchema = void 0;
const zod_1 = require("zod");
exports.serviceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    businessId: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    unit: zod_1.z.enum(['project', 'day', 'hour', 'deliverable']),
    unitPrice: zod_1.z.number(),
    currency: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.serviceListSchema = zod_1.z.array(exports.serviceSchema);
exports.createServiceBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().nullable().optional(),
    unit: zod_1.z.enum(['project', 'day', 'hour', 'deliverable']),
    unitPrice: zod_1.z.number(),
    currency: zod_1.z.string().min(1),
});
exports.updateServiceBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().nullable().optional(),
    unit: zod_1.z.enum(['project', 'day', 'hour', 'deliverable']).optional(),
    unitPrice: zod_1.z.number().nonnegative().optional(),
    currency: zod_1.z.string().min(1).optional(),
    isActive: zod_1.z.boolean().optional(),
});
