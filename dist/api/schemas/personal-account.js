"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePersonalAccountBodySchema = exports.createPersonalAccountBodySchema = exports.personalAccountListSchema = exports.personalAccountSchema = void 0;
const zod_1 = require("zod");
exports.personalAccountSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.string().nullable(),
    currency: zod_1.z.string().nullable(),
    isArchived: zod_1.z.boolean(),
    includeInBudget: zod_1.z.boolean().optional(),
    includeInNetWorth: zod_1.z.boolean().optional(),
    balance: zod_1.z.number().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.personalAccountListSchema = zod_1.z.array(exports.personalAccountSchema);
exports.createPersonalAccountBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().optional(),
    currency: zod_1.z.string().min(1).optional(),
    initialBalance: zod_1.z.number().optional(),
    isArchived: zod_1.z.boolean().optional(),
});
exports.updatePersonalAccountBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.string().optional(),
    currency: zod_1.z.string().min(1).optional(),
    isArchived: zod_1.z.boolean().optional(),
});
