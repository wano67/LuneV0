import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { personalScoreSchema } from '@/api/schemas/personal-insights-score';
import { personalInsightsScoreService } from '@/modules/personal/personal-insights-score.service';
import { normalizeUserId } from '@/modules/shared/ids';

export async function registerPersonalInsightsScoreRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/personal/insights/score',
    schema: {
      tags: ['Personal – Insights'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        months: z.string().regex(/^\d+$/).transform((v) => Number(v)).optional(),
      }),
      response: {
        200: z.object({ data: personalScoreSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const monthsStr = (request.query as any).months as number | undefined;
      const months = typeof monthsStr === 'number' && !Number.isNaN(monthsStr) ? monthsStr : undefined;

      const data = await personalInsightsScoreService.getScore({ userId, months });
      return reply.send({ data });
    },
  });
}
