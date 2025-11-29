import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { projectGanttOverviewSchema } from '@/api/schemas/project-gantt';
import { projectGanttService } from '@/modules/project/project-gantt.service';
import { normalizeProjectId, normalizeUserId } from '@/modules/shared/ids';

export async function registerProjectGanttRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/api/v1/projects/:projectId/gantt',
    schema: {
      tags: ['Business – Project Insights'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      response: {
        200: z.object({ data: projectGanttOverviewSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const projectId = normalizeProjectId(BigInt(request.params.projectId));

      const overview = await projectGanttService.getGantt({ userId, projectId });
      return reply.send({ data: overview });
    },
  });
}
