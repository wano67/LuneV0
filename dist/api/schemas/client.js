"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientBodySchema = exports.createClientBodySchema = exports.clientListSchema = exports.clientSchema = void 0;
const zod_1 = require("zod");
exports.clientSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    businessId: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['individual', 'company']),
    email: zod_1.z.string().email().nullable(),
    phone: zod_1.z.string().nullable(),
    companyName: zod_1.z.string().nullable(),
    vatNumber: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    notes: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.clientListSchema = zod_1.z.array(exports.clientSchema);
exports.createClientBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['individual', 'company']),
    email: zod_1.z.string().email().nullable().optional(),
    phone: zod_1.z.string().min(1).nullable().optional(),
    companyName: zod_1.z.string().min(1).nullable().optional(),
    vatNumber: zod_1.z.string().min(1).nullable().optional(),
    address: zod_1.z.string().min(1).nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
});
exports.updateClientBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(['individual', 'company']).optional(),
    email: zod_1.z.string().email().nullable().optional(),
    phone: zod_1.z.string().min(1).nullable().optional(),
    companyName: zod_1.z.string().min(1).nullable().optional(),
    vatNumber: zod_1.z.string().min(1).nullable().optional(),
    address: zod_1.z.string().min(1).nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
});
