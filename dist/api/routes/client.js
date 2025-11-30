"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClientRoutes = registerClientRoutes;
const zod_1 = require("zod");
const client_1 = require("@/api/schemas/client");
const client_service_1 = require("@/modules/client/client.service");
const ids_1 = require("@/modules/shared/ids");
const toClientDto = (client) => ({
    id: client.id.toString(),
    userId: client.user_id.toString(),
    businessId: client.business_id ? client.business_id.toString() : null,
    name: client.name,
    type: client.type,
    email: client.email,
    phone: client.phone,
    companyName: client.company_name,
    vatNumber: client.vat_number,
    address: client.address,
    notes: client.notes,
    createdAt: client.created_at.toISOString(),
    updatedAt: client.updated_at.toISOString(),
});
async function registerClientRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'POST',
        url: '/api/v1/businesses/:businessId/clients',
        schema: {
            tags: ['Business – Clients'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: client_1.createClientBodySchema,
            response: {
                201: zod_1.z.object({ data: client_1.clientSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const client = await client_service_1.clientService.createClient({
                userId,
                businessId,
                name: request.body.name,
                type: request.body.type,
                email: request.body.email ?? null,
                phone: request.body.phone ?? null,
                companyName: request.body.companyName ?? null,
                vatNumber: request.body.vatNumber ?? null,
                address: request.body.address ?? null,
                notes: request.body.notes ?? null,
            });
            return reply.code(201).send({ data: toClientDto(client) });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/clients',
        schema: {
            tags: ['Business – Clients'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: client_1.clientListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const clients = await client_service_1.clientService.listClientsForUser(userId, { businessId });
            return reply.send({ data: clients.map(toClientDto) });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/clients/:clientId',
        schema: {
            tags: ['Business – Clients'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ clientId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: client_1.clientSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const clientId = (0, ids_1.normalizeClientId)(BigInt(request.params.clientId));
            const client = await client_service_1.clientService.getClientForUser(clientId, userId);
            return reply.send({ data: toClientDto(client) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/api/v1/clients/:clientId',
        schema: {
            tags: ['Business – Clients'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ clientId: zod_1.z.string() }),
            body: client_1.updateClientBodySchema,
            response: {
                200: zod_1.z.object({ data: client_1.clientSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const clientId = (0, ids_1.normalizeClientId)(BigInt(request.params.clientId));
            const updated = await client_service_1.clientService.updateClient(clientId, userId, {
                name: request.body.name,
                type: request.body.type,
                email: request.body.email,
                phone: request.body.phone,
                companyName: request.body.companyName,
                vatNumber: request.body.vatNumber,
                address: request.body.address,
                notes: request.body.notes,
            });
            return reply.send({ data: toClientDto(updated) });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/api/v1/clients/:clientId',
        schema: {
            tags: ['Business – Clients'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ clientId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const clientId = (0, ids_1.normalizeClientId)(BigInt(request.params.clientId));
            await client_service_1.clientService.deleteClient(clientId, userId);
            return reply.code(204).send(null);
        },
    });
}
