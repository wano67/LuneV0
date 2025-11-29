import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  personalSavingsPlanQuerySchema,
  personalSavingsPlanSchema,
} from '@/api/schemas/personal-insights-savings';
import { personalSavingsPlanService } from '@/modules/personal/personal-insights-savings.service';
import { normalizeUserId } from '@/modules/shared/ids';

export async function registerPersonalInsightsSavingsPlanRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/personal/insights/savings-plan',
    schema: {
      tags: ['Personal – Insights'],
      security: [{ bearerAuth: [] }],
      querystring: personalSavingsPlanQuerySchema,
      response: {
        200: z.object({ data: personalSavingsPlanSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));

      const { targetAmount, targetDate, currentSavings } = request.query;

      const plan = await personalSavingsPlanService.getSavingsPlan(userId, {
        targetAmount,
        targetDate: new Date(`${targetDate}T00:00:00.000Z`),
        currentSavingsOverride: currentSavings,
      });

      return reply.send({ data: plan });
    },
  });
}
