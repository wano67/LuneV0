import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { personalSpendingByCategorySchema } from '@/api/schemas/personal-insights-spending';
import { personalInsightsSpendingService } from '@/modules/personal/personal-insights-spending.service';
import { normalizeUserId } from '@/modules/shared/ids';

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');

export async function registerPersonalInsightsSpendingRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/personal/insights/spending-by-category',
    schema: {
      tags: ['Personal – Insights'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        from: dateOnlySchema.optional(),
        to: dateOnlySchema.optional(),
      }),
      response: {
        200: z.object({ data: personalSpendingByCategorySchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const qs = request.query as { from?: string; to?: string };

      const data = await personalInsightsSpendingService.spendingByCategory({
        userId,
        from: qs.from,
        to: qs.to,
      });

      return reply.send({ data });
    },
  });
}
