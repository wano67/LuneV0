import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { projectInsightsOverviewSchema } from '@/api/schemas/project-insights';
import { projectInsightsService } from '@/modules/project/project-insights.service';
import { normalizeProjectId, normalizeUserId } from '@/modules/shared/ids';

export async function registerProjectInsightsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/api/v1/projects/:projectId/insights',
    schema: {
      tags: ['Business – Project Insights'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      response: {
        200: z.object({ data: projectInsightsOverviewSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const projectId = normalizeProjectId(BigInt(request.params.projectId));

      const overview = await projectInsightsService.getOverview(userId, projectId);
      return reply.send({ data: overview });
    },
  });
}
