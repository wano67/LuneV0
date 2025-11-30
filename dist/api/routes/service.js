"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerServiceRoutes = registerServiceRoutes;
const zod_1 = require("zod");
const service_1 = require("@/api/schemas/service");
const service_service_1 = require("@/modules/service/service.service");
const ids_1 = require("@/modules/shared/ids");
const decimalToNumber = (value) => typeof value === 'number' ? value : value.toNumber();
const toServiceDto = (service) => ({
    id: service.id.toString(),
    userId: service.user_id.toString(),
    businessId: service.business_id ? service.business_id.toString() : null,
    name: service.name,
    description: service.description,
    unit: service.unit,
    unitPrice: decimalToNumber(service.unit_price),
    currency: service.currency,
    isActive: service.is_active,
    createdAt: service.created_at.toISOString(),
    updatedAt: service.updated_at.toISOString(),
});
async function registerServiceRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'POST',
        url: '/api/v1/businesses/:businessId/services',
        schema: {
            tags: ['Business – Services'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: service_1.createServiceBodySchema,
            response: {
                201: zod_1.z.object({ data: service_1.serviceSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const service = await service_service_1.servicesService.createService({
                userId,
                businessId,
                name: request.body.name,
                description: request.body.description ?? null,
                unit: request.body.unit,
                unitPrice: request.body.unitPrice,
                currency: request.body.currency,
            });
            return reply.code(201).send({ data: toServiceDto(service) });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/services',
        schema: {
            tags: ['Business – Services'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: service_1.serviceListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const services = await service_service_1.servicesService.listServicesForUser(userId, { businessId });
            return reply.send({ data: services.map(toServiceDto) });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/services/:serviceId',
        schema: {
            tags: ['Business – Services'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ serviceId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: service_1.serviceSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const serviceId = (0, ids_1.normalizeServiceId)(BigInt(request.params.serviceId));
            const service = await service_service_1.servicesService.getServiceForUser(serviceId, userId);
            return reply.send({ data: toServiceDto(service) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/api/v1/services/:serviceId',
        schema: {
            tags: ['Business – Services'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ serviceId: zod_1.z.string() }),
            body: service_1.updateServiceBodySchema,
            response: {
                200: zod_1.z.object({ data: service_1.serviceSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const serviceId = (0, ids_1.normalizeServiceId)(BigInt(request.params.serviceId));
            const updated = await service_service_1.servicesService.updateService(serviceId, userId, {
                name: request.body.name,
                description: request.body.description,
                unit: request.body.unit,
                unitPrice: request.body.unitPrice,
                currency: request.body.currency,
                isActive: request.body.isActive,
            });
            return reply.send({ data: toServiceDto(updated) });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/api/v1/services/:serviceId',
        schema: {
            tags: ['Business – Services'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ serviceId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const serviceId = (0, ids_1.normalizeServiceId)(BigInt(request.params.serviceId));
            await service_service_1.servicesService.deleteService(serviceId, userId);
            return reply.code(204).send(null);
        },
    });
}
