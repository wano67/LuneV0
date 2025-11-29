import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  clientSchema,
  clientListSchema,
  createClientBodySchema,
  updateClientBodySchema,
} from '@/api/schemas/client';
import { clientService, type ClientSummary } from '@/modules/client/client.service';
import { normalizeBusinessId, normalizeClientId } from '@/modules/shared/ids';

const toClientDto = (client: ClientSummary) => ({
  id: client.id.toString(),
  userId: client.user_id.toString(),
  businessId: client.business_id ? client.business_id.toString() : null,
  name: client.name,
  type: client.type as 'individual' | 'company',
  email: client.email,
  phone: client.phone,
  companyName: client.company_name,
  vatNumber: client.vat_number,
  address: client.address,
  notes: client.notes,
  createdAt: client.created_at.toISOString(),
  updatedAt: client.updated_at.toISOString(),
});

export async function registerClientRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'POST',
    url: '/api/v1/businesses/:businessId/clients',
    schema: {
      tags: ['Business – Clients'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      body: createClientBodySchema,
      response: {
        201: z.object({ data: clientSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const client = await clientService.createClient({
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
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: clientListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const clients = await clientService.listClientsForUser(userId, { businessId });

      return reply.send({ data: clients.map(toClientDto) });
    },
  });

  server.route({
    method: 'GET',
    url: '/api/v1/clients/:clientId',
    schema: {
      tags: ['Business – Clients'],
      security: [{ bearerAuth: [] }],
      params: z.object({ clientId: z.string() }),
      response: {
        200: z.object({ data: clientSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const clientId = normalizeClientId(BigInt(request.params.clientId));

      const client = await clientService.getClientForUser(clientId, userId);

      return reply.send({ data: toClientDto(client) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/api/v1/clients/:clientId',
    schema: {
      tags: ['Business – Clients'],
      security: [{ bearerAuth: [] }],
      params: z.object({ clientId: z.string() }),
      body: updateClientBodySchema,
      response: {
        200: z.object({ data: clientSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const clientId = normalizeClientId(BigInt(request.params.clientId));

      const updated = await clientService.updateClient(clientId, userId, {
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
      params: z.object({ clientId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const clientId = normalizeClientId(BigInt(request.params.clientId));

      await clientService.deleteClient(clientId, userId);

      return reply.code(204).send(null);
    },
  });
}
