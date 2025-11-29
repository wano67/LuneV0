import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  businessAccountListSchema,
  businessAccountSchema,
  createBusinessAccountBodySchema,
  updateBusinessAccountBodySchema,
} from '@/api/schemas/business-account';
import { accountService } from '@/modules/account/account.service';
import { businessTransactionsService } from '@/modules/business/business-transactions.service';
import { normalizeAccountId, normalizeBusinessId, normalizeUserId } from '@/modules/shared/ids';
import { prisma } from '@/lib/prisma';

const toBusinessAccountDto = (account: any) => ({
  id: account.id.toString(),
  userId: account.user_id.toString(),
  businessId: account.business_id!.toString(),
  name: account.name,
  type: account.type,
  currency: account.currency,
  isArchived: !account.is_active,
  createdAt: account.created_at.toISOString(),
  updatedAt: account.updated_at.toISOString(),
});

export async function registerBusinessAccountRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/businesses/:businessId/accounts',
    schema: {
      tags: ['Business – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: businessAccountListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const accounts = await accountService.listBusinessAccountsForUser(userId, businessId, { includeInactive: true });
      return reply.send({ data: accounts.map(toBusinessAccountDto) });
    },
  });

  server.route({
    method: 'POST',
    url: '/businesses/:businessId/accounts',
    schema: {
      tags: ['Business – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      body: createBusinessAccountBodySchema,
      response: {
        201: z.object({ data: businessAccountSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const body = request.body;
      const account = await accountService.createBusinessAccount({
        userId,
        businessId,
        name: body.name,
        type: body.type as any,
        currency: body.currency,
        provider: null,
        includeInBudget: true,
        includeInNetWorth: true,
        connectionType: 'manual',
      });

      if (body.initialBalance && body.initialBalance !== 0) {
        await businessTransactionsService.create({
          userId,
          businessId,
          accountId: account.id,
          direction: body.initialBalance >= 0 ? 'in' : 'out',
          amount: Math.abs(body.initialBalance),
          occurredAt: new Date(),
          label: 'Opening balance',
        });
      }

      return reply.code(201).send({ data: toBusinessAccountDto(account) });
    },
  });

  server.route({
    method: 'GET',
    url: '/businesses/:businessId/accounts/:accountId',
    schema: {
      tags: ['Business – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), accountId: z.string() }),
      response: {
        200: z.object({ data: businessAccountSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const accountId = normalizeAccountId(BigInt(request.params.accountId));
      const account = await accountService.getAccountForUser(accountId, userId);
      if (account.business_id !== businessId) {
        throw new Error('Account not found');
      }
      return reply.send({ data: toBusinessAccountDto(account) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/businesses/:businessId/accounts/:accountId',
    schema: {
      tags: ['Business – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), accountId: z.string() }),
      body: updateBusinessAccountBodySchema,
      response: {
        200: z.object({ data: businessAccountSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const accountId = normalizeAccountId(BigInt(request.params.accountId));
      const updated = await accountService.updateAccount(accountId, userId, {
        name: request.body.name,
        type: request.body.type as any,
        currency: request.body.currency,
        isActive: request.body.isArchived === undefined ? undefined : !request.body.isArchived,
      });
      if (updated.business_id !== businessId) {
        throw new Error('Account not found');
      }
      return reply.send({ data: toBusinessAccountDto(updated) });
    },
  });

  server.route({
    method: 'DELETE',
    url: '/businesses/:businessId/accounts/:accountId',
    schema: {
      tags: ['Business – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), accountId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const accountId = normalizeAccountId(BigInt(request.params.accountId));
      const account = await accountService.getAccountForUser(accountId, userId);
      if (account.business_id !== businessId) {
        throw new Error('Account not found');
      }
      await prisma.accounts.delete({ where: { id: accountId } });
      return reply.code(204).send(null);
    },
  });
}
