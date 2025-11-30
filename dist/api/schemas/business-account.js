"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusinessAccountBodySchema = exports.createBusinessAccountBodySchema = exports.businessAccountListSchema = exports.businessAccountSchema = void 0;
const zod_1 = require("zod");
exports.businessAccountSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    businessId: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.string(),
    currency: zod_1.z.string(),
    isArchived: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.businessAccountListSchema = zod_1.z.array(exports.businessAccountSchema);
exports.createBusinessAccountBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    currency: zod_1.z.string().min(1).default('EUR'),
    initialBalance: zod_1.z.number().optional(),
});
exports.updateBusinessAccountBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.string().min(1).optional(),
    currency: zod_1.z.string().min(1).optional(),
    isArchived: zod_1.z.boolean().optional(),
});
