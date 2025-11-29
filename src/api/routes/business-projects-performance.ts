import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { businessProjectsPerformanceSchema } from '@/api/schemas/business-projects-performance';
import { businessProjectsPerformanceService } from '@/modules/business/business-projects-performance.service';
import { normalizeBusinessId, normalizeUserId } from '@/modules/shared/ids';

export async function registerBusinessProjectsPerformanceRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/api/v1/businesses/:businessId/insights/projects-performance',
    schema: {
      tags: ['Business – Project Insights'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: businessProjectsPerformanceSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const data = await businessProjectsPerformanceService.getPerformance({
        userId,
        businessId,
      });

      return reply.send({ data });
    },
  });
}
