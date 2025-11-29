import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { businessPipelineInsightsSchema } from '@/api/schemas/business-insights-pipeline';
import { businessInsightsPipelineService } from '@/modules/business/business-insights-pipeline.service';
import { normalizeBusinessId, normalizeUserId } from '@/modules/shared/ids';

export async function registerBusinessInsightsPipelineRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/api/v1/businesses/:businessId/insights/pipeline',
    schema: {
      tags: ['Business – Project Insights'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: businessPipelineInsightsSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const data = await businessInsightsPipelineService.getPipeline({ userId, businessId });
      return reply.send({ data });
    },
  });
}
