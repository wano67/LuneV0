import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { serviceSchema, serviceListSchema, createServiceBodySchema, updateServiceBodySchema } from '@/api/schemas/service';
import { servicesService, type ServiceSummary } from '@/modules/service/service.service';
import { normalizeBusinessId, normalizeServiceId } from '@/modules/shared/ids';

const decimalToNumber = (value: { toNumber: () => number } | number) =>
  typeof value === 'number' ? value : value.toNumber();

const toServiceDto = (service: ServiceSummary) => ({
  id: service.id.toString(),
  userId: service.user_id.toString(),
  businessId: service.business_id ? service.business_id.toString() : null,
  name: service.name,
  description: service.description,
  unit: service.unit as 'project' | 'day' | 'hour' | 'deliverable',
  unitPrice: decimalToNumber(service.unit_price as any),
  currency: service.currency,
  isActive: service.is_active,
  createdAt: service.created_at.toISOString(),
  updatedAt: service.updated_at.toISOString(),
});

export async function registerServiceRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'POST',
    url: '/api/v1/businesses/:businessId/services',
    schema: {
      tags: ['Business – Services'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      body: createServiceBodySchema,
      response: {
        201: z.object({ data: serviceSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const service = await servicesService.createService({
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
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: serviceListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const services = await servicesService.listServicesForUser(userId, { businessId });

      return reply.send({ data: services.map(toServiceDto) });
    },
  });

  server.route({
    method: 'GET',
    url: '/api/v1/services/:serviceId',
    schema: {
      tags: ['Business – Services'],
      security: [{ bearerAuth: [] }],
      params: z.object({ serviceId: z.string() }),
      response: {
        200: z.object({ data: serviceSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const serviceId = normalizeServiceId(BigInt(request.params.serviceId));

      const service = await servicesService.getServiceForUser(serviceId, userId);
      return reply.send({ data: toServiceDto(service) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/api/v1/services/:serviceId',
    schema: {
      tags: ['Business – Services'],
      security: [{ bearerAuth: [] }],
      params: z.object({ serviceId: z.string() }),
      body: updateServiceBodySchema,
      response: {
        200: z.object({ data: serviceSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const serviceId = normalizeServiceId(BigInt(request.params.serviceId));

      const updated = await servicesService.updateService(serviceId, userId, {
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
      params: z.object({ serviceId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const serviceId = normalizeServiceId(BigInt(request.params.serviceId));

      await servicesService.deleteService(serviceId, userId);
      return reply.code(204).send(null);
    },
  });
}
