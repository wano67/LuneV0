import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  createPersonalAccountBodySchema,
  personalAccountListSchema,
  personalAccountSchema,
  updatePersonalAccountBodySchema,
} from '@/api/schemas/personal-account';
import { accountService } from '@/modules/account/account.service';
import { personalTransactionsService } from '@/modules/personal/personal-transactions.service';
import { normalizeAccountId, normalizeUserId } from '@/modules/shared/ids';
import { prisma } from '@/lib/prisma';

const toAccountDto = (account: any) => ({
  id: account.id.toString(),
  userId: account.user_id.toString(),
  name: account.name,
  type: account.type,
  currency: account.currency,
  isArchived: !account.is_active,
  includeInBudget: account.include_in_budget,
  includeInNetWorth: account.include_in_net_worth,
  createdAt: account.created_at.toISOString(),
  updatedAt: account.updated_at.toISOString(),
});

// ⚠️ IMPORTANT : ce type doit exister dans account.service.ts
// Si tu as encore "Invalid account type", ouvre account.service.ts
// et mets ici un des types autorisés (ex: 'cash', 'other', etc.)
const DEFAULT_PERSONAL_ACCOUNT_TYPE = 'cash';

export async function registerPersonalAccountRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // LIST ----------------------------------------------------------------------
  server.route({
    method: 'GET',
    url: '/personal/accounts',
    schema: {
      tags: ['Personal – Accounts'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ data: personalAccountListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(
        BigInt((request.user as any).id ?? (request.user as any).sub),
      );
      const accounts = await accountService.listPersonalAccountsForUser(userId, {
        includeInactive: true,
      });
      return reply.send({ data: accounts.map(toAccountDto) });
    },
  });

  // CREATE --------------------------------------------------------------------
  server.route({
    method: 'POST',
    url: '/personal/accounts',
    schema: {
      tags: ['Personal – Accounts'],
      security: [{ bearerAuth: [] }],
      body: createPersonalAccountBodySchema,
      response: {
        201: z.object({ data: personalAccountSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(
        BigInt((request.user as any).id ?? (request.user as any).sub),
      );
      const body = request.body;

      // On ignore complètement le type envoyé, on force un type safe pour le domaine.
      const account = await accountService.createPersonalAccount({
        userId,
        name: body.name,
        type: DEFAULT_PERSONAL_ACCOUNT_TYPE as any,
        currency: (body.currency as any) ?? 'EUR',
        provider: null,
        includeInBudget: true,
        includeInNetWorth: true,
        connectionType: 'manual',
      });

      // optional opening balance
      if (body.initialBalance && body.initialBalance !== 0) {
        await personalTransactionsService.create({
          userId,
          accountId: account.id,
          direction: body.initialBalance >= 0 ? 'in' : 'out',
          amount: Math.abs(body.initialBalance),
          occurredAt: new Date(),
          label: 'Opening balance',
        });
      }

      return reply.code(201).send({ data: toAccountDto(account) });
    },
  });

  // GET ONE -------------------------------------------------------------------
  server.route({
    method: 'GET',
    url: '/personal/accounts/:accountId',
    schema: {
      tags: ['Personal – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ accountId: z.string() }),
      response: {
        200: z.object({ data: personalAccountSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(
        BigInt((request.user as any).id ?? (request.user as any).sub),
      );
      const accountId = normalizeAccountId(BigInt(request.params.accountId));
      const account = await accountService.getAccountForUser(accountId, userId);
      if (account.business_id !== null) {
        throw new Error('Account not found');
      }
      return reply.send({ data: toAccountDto(account) });
    },
  });

  // PATCH ---------------------------------------------------------------------
  server.route({
    method: 'PATCH',
    url: '/personal/accounts/:accountId',
    schema: {
      tags: ['Personal – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ accountId: z.string() }),
      body: updatePersonalAccountBodySchema,
      response: {
        200: z.object({ data: personalAccountSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(
        BigInt((request.user as any).id ?? (request.user as any).sub),
      );
      const accountId = normalizeAccountId(BigInt(request.params.accountId));

      // Pour l’instant on ignore aussi les changements de type côté API,
      // ça évite de retomber sur "Invalid account type".
      const updated = await accountService.updateAccount(accountId, userId, {
        name: request.body.name,
        type: undefined,
        currency: request.body.currency,
        isActive:
          request.body.isArchived === undefined ? undefined : !request.body.isArchived,
      });

      if (updated.business_id !== null) {
        throw new Error('Account not found');
      }
      return reply.send({ data: toAccountDto(updated) });
    },
  });

  // DELETE --------------------------------------------------------------------
  server.route({
    method: 'DELETE',
    url: '/personal/accounts/:accountId',
    schema: {
      tags: ['Personal – Accounts'],
      security: [{ bearerAuth: [] }],
      params: z.object({ accountId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(
        BigInt((request.user as any).id ?? (request.user as any).sub),
      );
      const accountId = normalizeAccountId(BigInt(request.params.accountId));
      const account = await accountService.getAccountForUser(accountId, userId);
      if (account.business_id !== null) {
        throw new Error('Account not found');
      }
      await prisma.accounts.delete({ where: { id: accountId } });
      return reply.code(204).send(null);
    },
  });
}
