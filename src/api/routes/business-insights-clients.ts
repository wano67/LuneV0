import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { businessTopClientsSchema } from '@/api/schemas/business-insights-clients';
import { businessInsightsClientsService } from '@/modules/business/business-insights-clients.service';
import { normalizeBusinessId, normalizeUserId } from '@/modules/shared/ids';

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');

export async function registerBusinessInsightsClientsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/api/v1/businesses/:businessId/insights/top-clients',
    schema: {
      tags: ['Business – Revenue Insights'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      querystring: z.object({
        from: dateOnlySchema.optional(),
        to: dateOnlySchema.optional(),
      }),
      response: {
        200: z.object({ data: businessTopClientsSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const qs = request.query as { from?: string; to?: string };

      const fromDate = qs.from ? new Date(`${qs.from}T00:00:00.000Z`) : undefined;
      const toDate = qs.to ? new Date(`${qs.to}T00:00:00.000Z`) : undefined;

      const data = await businessInsightsClientsService.getTopClients({
        userId,
        businessId,
        from: fromDate,
        to: toDate,
      });

      return reply.send({ data });
    },
  });
}
