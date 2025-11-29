import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { personalInsightsOverviewSchema } from '@/api/schemas/personal-insights';
import { personalInsightsService } from '@/modules/personal/personal-insights.service';
import { normalizeUserId } from '@/modules/shared/ids';

export async function registerPersonalInsightsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/personal/insights/overview',
    schema: {
      tags: ['Personal – Insights'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ data: personalInsightsOverviewSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const overview = await personalInsightsService.getOverview(userId);
      return reply.send({ data: overview });
    },
  });
}
