"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessTopServicesSchema = void 0;
const zod_1 = require("zod");
exports.businessTopServicesSchema = zod_1.z.object({
    businessId: zod_1.z.string(),
    currency: zod_1.z.string(),
    period: zod_1.z.object({
        from: zod_1.z.string(),
        to: zod_1.z.string(),
    }),
    topServices: zod_1.z.array(zod_1.z.object({
        serviceId: zod_1.z.string(),
        name: zod_1.z.string(),
        totalInvoiced: zod_1.z.number(),
        totalPaid: zod_1.z.number(),
        projectCount: zod_1.z.number(),
        averagePrice: zod_1.z.number(),
        lastActivityAt: zod_1.z.string().nullable(),
    })),
    generatedAt: zod_1.z.string(),
});
