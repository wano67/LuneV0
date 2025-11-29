import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { personalInsightsService } from '@/modules/personal/personal-insights.service';
import { accountService } from '@/modules/account/account.service';
import { personalTransactionsService } from '@/modules/personal/personal-transactions.service';
import { personalBudgetsService } from '@/modules/personal/personal-budgets.service';
import { normalizeUserId } from '@/modules/shared/ids';

const overviewResponseSchema = z.object({
  data: z.object({
    summary: z.object({
      totalNetWorth: z.number(),
      totalCash: z.number(),
      monthIncome: z.number(),
      monthExpense: z.number(),
      monthNetCashflow: z.number(),
      currency: z.string(),
    }),
    budgets: z.object({
      activeBudget: z
        .object({
          id: z.string(),
          name: z.string().nullable(),
          periodType: z.string(),
          year: z.number(),
          month: z.number(),
          totalLimit: z.number().nullable(),
          totalSpent: z.number().nullable(),
          utilizationPct: z.number().nullable(),
        })
        .nullable(),
    }),
    accounts: z.object({
      topAccounts: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          currency: z.string(),
          balance: z.number(),
          includeInNetWorth: z.boolean(),
        }),
      ),
    }),
    transactions: z.object({
      recent: z.array(
        z.object({
          id: z.string(),
          date: z.string(),
          label: z.string(),
          amount: z.number(),
          direction: z.enum(['in', 'out']),
          accountName: z.string(),
          categoryName: z.string().nullable().optional(),
        }),
      ),
    }),
  }),
});

export async function registerPersonalOverviewRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/personal/overview',
    schema: {
      tags: ['Personal – Overview'],
      security: [{ bearerAuth: [] }],
      response: {
        200: overviewResponseSchema,
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));

      const [insights, accounts, txs, budgets] = await Promise.all([
        personalInsightsService.getOverview(userId),
        accountService.listPersonalAccountsForUser(userId, { includeInactive: false }),
        personalTransactionsService.list(userId, { accountId: undefined, dateFrom: undefined, dateTo: undefined, direction: undefined }),
        personalBudgetsService.listForUser(userId),
      ]);

      const now = new Date();
      const month = now.getUTCMonth() + 1;
      const year = now.getUTCFullYear();

      const activeBudget = budgets.find((b) => {
        const start = b.start_date ? b.start_date.getUTCMonth() + 1 : null;
        const startYear = b.start_date ? b.start_date.getUTCFullYear() : null;
        return start === month && startYear === year;
      });

      return reply.send({
        data: {
          summary: {
            totalNetWorth: insights.totalBalance ?? 0,
            totalCash: insights.totalBalance ?? 0,
            monthIncome: insights.monthIncome ?? 0,
            monthExpense: insights.monthSpending ?? 0,
            monthNetCashflow: insights.monthNet ?? 0,
            currency: insights.baseCurrency ?? 'EUR',
          },
          budgets: {
            activeBudget: activeBudget
              ? {
                  id: activeBudget.id.toString(),
                  name: activeBudget.name ?? null,
                  periodType: 'monthly',
                  year,
                  month,
                  totalLimit: activeBudget.total_spending_limit ? Number(activeBudget.total_spending_limit) : null,
                  totalSpent: null,
                  utilizationPct: null,
                }
              : null,
          },
          accounts: {
            topAccounts: accounts
              .slice(0, 3)
              .map((a) => ({
                id: a.id.toString(),
                name: a.name,
                type: a.type,
                currency: a.currency ?? 'EUR',
                balance: 0,
                includeInNetWorth: a.include_in_net_worth,
              })),
          },
          transactions: {
            recent: txs.slice(0, 5).map((t) => ({
              id: t.id.toString(),
              date: t.date.toISOString(),
              label: t.label,
              amount: Number(t.amount),
              direction: t.direction as 'in' | 'out',
              accountName: accounts.find((a) => a.id === t.account_id)?.name ?? 'Account',
              categoryName: t.notes ?? null,
            })),
          },
        },
      });
    },
  });
}
