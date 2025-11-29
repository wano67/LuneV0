import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function registerHealthRoutes(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .route({
      method: 'GET',
      url: '/api/v1/health',
      schema: {
        description: 'Healthcheck simple du backend',
        tags: ['Health'],
        response: {
          200: z.object({
            data: z.object({
              status: z.literal('ok'),
              uptime: z.number(),
            }),
          }),
        },
      },
      async handler(_request, reply) {
        const payload = {
          status: 'ok' as const,
          uptime: process.uptime(),
        };

        return reply.send({ data: payload });
      },
    });
}
