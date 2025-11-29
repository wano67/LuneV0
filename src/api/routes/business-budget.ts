import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  businessBudgetListSchema,
  businessBudgetSchema,
  createBusinessBudgetBodySchema,
  updateBusinessBudgetBodySchema,
} from '@/api/schemas/business-budget';
import { businessBudgetsService } from '@/modules/business/business-budgets.service';
import { normalizeBusinessId, normalizeUserId } from '@/modules/shared/ids';

const decimalToNumber = (value: any): number =>
  typeof value === 'number' ? value : value.toNumber();

const parseDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

const toBusinessBudgetDto = (budget: any) => ({
  id: budget.id.toString(),
  userId: budget.user_id.toString(),
  businessId: budget.business_id!.toString(),
  name: budget.name,
  currency: budget.currency ?? 'EUR',
  amount: decimalToNumber(budget.total_spending_limit ?? 0),
  periodStart: budget.start_date?.toISOString() ?? new Date().toISOString(),
  periodEnd: budget.end_date?.toISOString() ?? new Date().toISOString(),
  createdAt: budget.created_at.toISOString(),
  updatedAt: budget.updated_at.toISOString(),
});

export async function registerBusinessBudgetRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/businesses/:businessId/budgets',
    schema: {
      tags: ['Business – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: businessBudgetListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const budgets = await businessBudgetsService.listForBusiness(userId, businessId);
      return reply.send({ data: budgets.map(toBusinessBudgetDto) });
    },
  });

  server.route({
    method: 'POST',
    url: '/businesses/:businessId/budgets',
    schema: {
      tags: ['Business – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      body: createBusinessBudgetBodySchema,
      response: {
        201: z.object({ data: businessBudgetSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const body = request.body;

      const budget = await businessBudgetsService.createForBusiness({
        userId,
        businessId,
        name: body.name,
        currency: body.currency ?? 'EUR',
        amount: body.amount,
        periodStart: parseDateOnly(body.periodStart),
        periodEnd: parseDateOnly(body.periodEnd),
      });

      return reply.code(201).send({ data: toBusinessBudgetDto(budget) });
    },
  });

  server.route({
    method: 'GET',
    url: '/businesses/:businessId/budgets/:budgetId',
    schema: {
      tags: ['Business – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), budgetId: z.string() }),
      response: {
        200: z.object({ data: businessBudgetSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const budgetId = BigInt(request.params.budgetId);

      const budget = await businessBudgetsService.getForBusiness(budgetId, userId, businessId);
      return reply.send({ data: toBusinessBudgetDto(budget) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/businesses/:businessId/budgets/:budgetId',
    schema: {
      tags: ['Business – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), budgetId: z.string() }),
      body: updateBusinessBudgetBodySchema,
      response: {
        200: z.object({ data: businessBudgetSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const budgetId = BigInt(request.params.budgetId);
      const body = request.body;

      const updated = await businessBudgetsService.updateForBusiness(
        budgetId,
        userId,
        businessId,
        {
          name: body.name,
          currency: body.currency,
          amount: body.amount,
          periodStart: body.periodStart ? parseDateOnly(body.periodStart) : undefined,
          periodEnd: body.periodEnd ? parseDateOnly(body.periodEnd) : undefined,
        },
      );

      return reply.send({ data: toBusinessBudgetDto(updated) });
    },
  });

  server.route({
    method: 'DELETE',
    url: '/businesses/:businessId/budgets/:budgetId',
    schema: {
      tags: ['Business – Budgets'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), budgetId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const budgetId = BigInt(request.params.budgetId);

      await businessBudgetsService.deleteForBusiness(budgetId, userId, businessId);
      return reply.code(204).send(null);
    },
  });
}
