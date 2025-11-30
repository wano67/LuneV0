import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  personalBudgetListSchema,
  personalBudgetSchema,
  createPersonalBudgetBodySchema,
  updatePersonalBudgetBodySchema,
} from '@/api/schemas/personal-budget';
import { personalBudgetsService } from '@/modules/personal/personal-budgets.service';
import { normalizeUserId } from '@/modules/shared/ids';
import { personalTransactionsService } from '@/modules/personal/personal-transactions.service';

const decimalToNumber = (value: any): number =>
  typeof value === 'number' ? value : value.toNumber();

const parseDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

const toPersonalBudgetDto = (budget: any, spent?: number) => {
  const amount = decimalToNumber(budget.total_spending_limit ?? 0);
  const spentValue = spent ?? 0;
  const remaining = amount - spentValue;
  const utilizationPct = amount > 0 ? Math.min(100, (spentValue / amount) * 100) : undefined;

  return {
    id: budget.id.toString(),
    userId: budget.user_id.toString(),
    name: budget.name,
    currency: budget.currency ?? 'EUR',
    amount,
    periodStart: budget.start_date?.toISOString() ?? new Date().toISOString(),
    periodEnd: budget.end_date?.toISOString() ?? new Date().toISOString(),
    spent: spentValue,
    remaining,
    utilizationPct,
    createdAt: budget.created_at.toISOString(),
    updatedAt: budget.updated_at.toISOString(),
  };
};

async function computeBudgetSpent(userId: bigint, budget: any) {
  if (!budget.start_date || !budget.end_date) return 0;
  const txs = await personalTransactionsService.list(userId, {
    accountId: undefined,
    dateFrom: budget.start_date,
    dateTo: budget.end_date,
    direction: 'out',
  });
  return txs.reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
}

export async function registerPersonalBudgetRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/personal/budgets',
    schema: {
      tags: ['Personal – Budgets'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ data: personalBudgetListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const budgets = await personalBudgetsService.listForUser(userId);
      const withSpent = await Promise.all(
        budgets.map(async (b) => {
          const spent = await computeBudgetSpent(userId, b);
          return toPersonalBudgetDto(b, spent);
        }),
      );
      return reply.send({ data: withSpent });
    },
  });

  server.route({
    method: 'POST',
    url: '/personal/budgets',
    schema: {
      tags: ['Personal – Budgets'],
      security: [{ bearerAuth: [] }],
      body: createPersonalBudgetBodySchema,
      response: {
        201: z.object({ data: personalBudgetSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const body = request.body;

      const budget = await personalBudgetsService.createForUser({
        userId,
        name: body.name,
        currency: body.currency ?? 'EUR',
        amount: body.amount,
        periodStart: parseDateOnly(body.periodStart),
        periodEnd: parseDateOnly(body.periodEnd),
      });

      const spent = await computeBudgetSpent(userId, budget);
      return reply.code(201).send({ data: toPersonalBudgetDto(budget, spent) });
    },
  });

  server.route({
    method: 'GET',
    url: '/personal/budgets/:budgetId',
    schema: {
      tags: ['Personal – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ budgetId: z.string() }),
      response: {
        200: z.object({ data: personalBudgetSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const budgetId = BigInt(request.params.budgetId);

      const budget = await personalBudgetsService.getForUser(budgetId, userId);
      const spent = await computeBudgetSpent(userId, budget);
      return reply.send({ data: toPersonalBudgetDto(budget, spent) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/personal/budgets/:budgetId',
    schema: {
      tags: ['Personal – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ budgetId: z.string() }),
      body: updatePersonalBudgetBodySchema,
      response: {
        200: z.object({ data: personalBudgetSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const budgetId = BigInt(request.params.budgetId);
      const body = request.body;

      const updated = await personalBudgetsService.updateForUser(budgetId, userId, {
        name: body.name,
        currency: body.currency,
        amount: body.amount,
        periodStart: body.periodStart ? parseDateOnly(body.periodStart) : undefined,
        periodEnd: body.periodEnd ? parseDateOnly(body.periodEnd) : undefined,
      });

      const spent = await computeBudgetSpent(userId, updated);
      return reply.send({ data: toPersonalBudgetDto(updated, spent) });
    },
  });

  server.route({
    method: 'DELETE',
    url: '/personal/budgets/:budgetId',
    schema: {
      tags: ['Personal – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ budgetId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const budgetId = BigInt(request.params.budgetId);

      await personalBudgetsService.deleteForUser(budgetId, userId);
      return reply.code(204).send(null);
    },
  });
}
