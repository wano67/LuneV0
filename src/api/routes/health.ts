import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '@/lib/prisma';

export async function registerHealthRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.route({
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

  typedApp.route({
    method: 'GET',
    url: '/api/v1/health/db',
    schema: {
      description: 'Vérifie la connexion à la base Postgres',
      tags: ['Health'],
      response: {
        200: z.object({
          data: z.object({
            status: z.literal('ok'),
            db: z.literal('connected'),
            latencyMs: z.number(),
          }),
        }),
        503: z.object({
          error: z.object({
            code: z.literal('db_unreachable'),
            message: z.string(),
          }),
        }),
      },
    },
    async handler(_request, reply) {
      const startedAt = Date.now();
      try {
        const result = await prisma.$queryRaw<{ result: number }[]>`SELECT 1 as result`;
        const isConnected = Array.isArray(result) && result[0]?.result === 1;

        if (!isConnected) {
          throw new Error('Unexpected DB response');
        }

        return reply.send({
          data: {
            status: 'ok' as const,
            db: 'connected' as const,
            latencyMs: Date.now() - startedAt,
          },
        });
      } catch (err) {
        app.log.error({ err }, 'Database healthcheck failed');

        return reply.status(503).send({
          error: {
            code: 'db_unreachable',
            message: 'Database connection failed',
          },
        });
      }
    },
  });
}
