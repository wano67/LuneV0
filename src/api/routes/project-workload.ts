import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { projectWorkloadOverviewSchema } from '@/api/schemas/project-workload';
import { projectWorkloadService } from '@/modules/project/project-workload.service';
import { normalizeProjectId, normalizeUserId } from '@/modules/shared/ids';

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');

export async function registerProjectWorkloadRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/api/v1/projects/:projectId/workload',
    schema: {
      tags: ['Business – Project Insights'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      querystring: z.object({
        from: dateOnlySchema.optional(),
        to: dateOnlySchema.optional(),
        granularity: z.enum(['week', 'month']).optional(),
      }),
      response: {
        200: z.object({ data: projectWorkloadOverviewSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const projectId = normalizeProjectId(BigInt(request.params.projectId));

      const qs = request.query as {
        from?: string;
        to?: string;
        granularity?: 'week' | 'month';
      };

      const fromDate = qs.from ? new Date(`${qs.from}T00:00:00.000Z`) : undefined;
      const toDate = qs.to ? new Date(`${qs.to}T00:00:00.000Z`) : undefined;

      const overview = await projectWorkloadService.getWorkload({
        userId,
        projectId,
        from: fromDate,
        to: toDate,
        granularity: qs.granularity,
      });

      return reply.send({ data: overview });
    },
  });
}
