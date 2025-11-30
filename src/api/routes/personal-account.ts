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

const toAccountDto = (account: any, balance: number) => ({
  id: account.id.toString(),
  userId: account.user_id.toString(),
  name: account.name,
  type: account.type,
  currency: account.currency,
  isArchived: !account.is_active,
  includeInBudget: account.include_in_budget,
  includeInNetWorth: account.include_in_net_worth,
  balance,
  createdAt: account.created_at.toISOString(),
  updatedAt: account.updated_at.toISOString(),
});

// ⚠️ IMPORTANT : ce type doit exister dans account.service.ts
// Si tu as encore "Invalid account type", ouvre account.service.ts
// et mets ici un des types autorisés (ex: 'cash', 'other', etc.)
const DEFAULT_PERSONAL_ACCOUNT_TYPE = 'cash';

const computeBalance = async (userId: bigint, accountId: bigint) => {
  const tx = await prisma.transactions.groupBy({
    where: { user_id: userId, business_id: null, account_id: accountId },
    by: ['direction'],
    _sum: { amount: true },
  });
  return tx.reduce((sum, row) => {
    const amount = Number(row._sum.amount ?? 0);
    if (row.direction === 'in') return sum + amount;
    if (row.direction === 'out') return sum - amount;
    return sum;
  }, 0);
};

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

      const balancesRaw = await prisma.transactions.groupBy({
        where: {
          user_id: userId,
          business_id: null,
          account_id: { in: accounts.map((a) => a.id) },
        },
        by: ['account_id', 'direction'],
        _sum: { amount: true },
      });

      const balanceMap = new Map<bigint, number>();
      for (const row of balancesRaw) {
        const current = balanceMap.get(row.account_id) ?? 0;
        const amount = Number(row._sum.amount ?? 0);
        if (row.direction === 'in') balanceMap.set(row.account_id, current + amount);
        else if (row.direction === 'out') balanceMap.set(row.account_id, current - amount);
        else balanceMap.set(row.account_id, current);
      }

      return reply.send({
        data: accounts.map((a) => toAccountDto(a, balanceMap.get(a.id) ?? 0)),
      });
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

      const balance = await computeBalance(userId, account.id);
      return reply.code(201).send({ data: toAccountDto(account, balance) });
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
      const tx = await prisma.transactions.groupBy({
        where: { user_id: userId, business_id: null, account_id: accountId },
        by: ['direction'],
        _sum: { amount: true },
      });
      const balance = tx.reduce((sum, row) => {
        const amount = Number(row._sum.amount ?? 0);
        if (row.direction === 'in') return sum + amount;
        if (row.direction === 'out') return sum - amount;
        return sum;
      }, 0);
      return reply.send({ data: toAccountDto(account, balance) });
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
      const balance = await computeBalance(userId, accountId);
      return reply.send({ data: toAccountDto(updated, balance) });
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
