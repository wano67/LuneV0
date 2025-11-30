"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusinessSettingsBodySchema = exports.updateBusinessProfileBodySchema = exports.createBusinessBodySchema = exports.businessListSchema = exports.businessSettingsSchema = exports.businessSchema = void 0;
const zod_1 = require("zod");
exports.businessSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    name: zod_1.z.string(),
    legalForm: zod_1.z.string().nullable(),
    registrationNumber: zod_1.z.string().nullable(),
    taxId: zod_1.z.string().nullable(),
    currency: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.businessSettingsSchema = zod_1.z.object({
    businessId: zod_1.z.string(),
    invoicePrefix: zod_1.z.string().nullable(),
    invoiceNextNumber: zod_1.z.number(),
    quotePrefix: zod_1.z.string().nullable(),
    quoteNextNumber: zod_1.z.number(),
    defaultVatRate: zod_1.z.number().nullable(),
    defaultPaymentTermsDays: zod_1.z.number(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.businessListSchema = zod_1.z.array(zod_1.z.object({
    business: exports.businessSchema,
    settings: exports.businessSettingsSchema,
}));
exports.createBusinessBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    legalForm: zod_1.z.string().min(1).nullable().optional(),
    registrationNumber: zod_1.z.string().min(1).nullable().optional(),
    taxId: zod_1.z.string().min(1).nullable().optional(),
    currency: zod_1.z.string().min(1).nullable().optional(),
    invoicePrefix: zod_1.z.string().min(1).nullable().optional(),
    quotePrefix: zod_1.z.string().min(1).nullable().optional(),
    defaultVatRate: zod_1.z.number().min(0).max(100).nullable().optional(),
    defaultPaymentTermsDays: zod_1.z.number().int().nonnegative().nullable().optional(),
});
exports.updateBusinessProfileBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    legalForm: zod_1.z.string().min(1).nullable().optional(),
    registrationNumber: zod_1.z.string().min(1).nullable().optional(),
    taxId: zod_1.z.string().min(1).nullable().optional(),
    currency: zod_1.z.string().min(1).nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateBusinessSettingsBodySchema = zod_1.z.object({
    invoicePrefix: zod_1.z.string().min(1).nullable().optional(),
    invoiceNextNumber: zod_1.z.number().int().positive().nullable().optional(),
    quotePrefix: zod_1.z.string().min(1).nullable().optional(),
    quoteNextNumber: zod_1.z.number().int().positive().nullable().optional(),
    defaultVatRate: zod_1.z.number().min(0).max(100).nullable().optional(),
    defaultPaymentTermsDays: zod_1.z.number().int().nonnegative().nullable().optional(),
});
