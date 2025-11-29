// src/api/routes/auth.ts
import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  signupBodySchema,
  loginBodySchema,
  authTokenResponseSchema,
  authUserSchema,
} from '@/api/schemas/auth';
import { userService } from '@/modules/user/user.service';
import { prisma } from '@/lib/prisma';

export async function registerAuthRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // SIGNUP
  server.route({
    method: 'POST',
    url: '/api/v1/auth/signup',
    schema: {
      tags: ['Auth'],
      body: signupBodySchema,
      response: {
        201: z.object({ data: authTokenResponseSchema }),
      },
    },
    async handler(request, reply) {
      const { email, password, displayName } = request.body;

      // TODO: en prod, hasher le password
      const { user } = await userService.createUserWithDefaultSettings({
        email,
        passwordHash: password,
        displayName,
      });

      const accessToken = await reply.jwtSign({ sub: user.id.toString() });

      return reply.code(201).send({
        data: {
          accessToken,
          user: {
            id: user.id.toString(),
            email: user.email,
            displayName: user.display_name ?? null,
          },
        },
      });
    },
  });

  // LOGIN
  server.route({
    method: 'POST',
    url: '/api/v1/auth/login',
    schema: {
      tags: ['Auth'],
      body: loginBodySchema,
      response: {
        200: z.object({ data: authTokenResponseSchema }),
        401: z.object({
          error: z.object({
            code: z.literal('invalid_credentials'),
            message: z.string(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { email, password } = request.body;

      const user = await prisma.users.findUnique({
        where: { email },
      });

      // TODO: comparer password hash correctement
      if (!user || user.password_hash !== password) {
        return reply.code(401).send({
          error: {
            code: 'invalid_credentials',
            message: 'Invalid email or password',
          },
        });
      }

      const accessToken = await reply.jwtSign({ sub: user.id.toString() });

      return reply.send({
        data: {
          accessToken,
          user: {
            id: user.id.toString(),
            email: user.email,
            displayName: user.display_name ?? null,
          },
        },
      });
    },
  });

  // ME
  server.route({
    method: 'GET',
    url: '/api/v1/me',
    schema: {
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ data: authUserSchema }),
        404: z.object({
          error: z.object({
            code: z.literal('user_not_found'),
            message: z.string(),
          }),
        }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userIdStr = request.user.id; // rempli par authPlugin
      const userId = BigInt(userIdStr);

      const user = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.code(404).send({
          error: { code: 'user_not_found', message: 'User not found' },
        });
      }

      return reply.send({
        data: {
          id: user.id.toString(),
          email: user.email,
          displayName: user.display_name ?? null,
        },
      });
    },
  });
}
