import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { personalInsightsService } from '@/modules/personal/personal-insights.service';
import { accountService } from '@/modules/account/account.service';
import { personalTransactionsService } from '@/modules/personal/personal-transactions.service';
import { personalBudgetsService } from '@/modules/personal/personal-budgets.service';
import { normalizeUserId } from '@/modules/shared/ids';

const dateOnlyStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');

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
    period: z
      .object({
        from: z.string().nullable(),
        to: z.string().nullable(),
        income: z.number(),
        expense: z.number(),
        net: z.number(),
        savingsRate: z.number().nullable(),
      })
      .optional(),
    series: z
      .array(
        z.object({
          month: z.string(),
          income: z.number(),
          expense: z.number(),
          net: z.number(),
        }),
      )
      .optional(),
    categories: z
      .array(
        z.object({
          name: z.string(),
          total: z.number(),
          count: z.number(),
        }),
      )
      .optional(),
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
      querystring: z
        .object({
          from: dateOnlyStringSchema.optional(),
          to: dateOnlyStringSchema.optional(),
        })
        .optional(),
      response: {
        200: overviewResponseSchema,
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));

      const fromDate = request.query?.from ? new Date(`${request.query.from}T00:00:00.000Z`) : undefined;
      const toDate = request.query?.to ? new Date(`${request.query.to}T23:59:59.999Z`) : undefined;

      const txFilters = {
        accountId: undefined as any,
        dateFrom: fromDate,
        dateTo: toDate,
        direction: undefined as any,
      };

      const [insights, accounts, txs, budgets] = await Promise.all([
        personalInsightsService.getOverview(userId),
        accountService.listPersonalAccountsForUser(userId, { includeInactive: false }),
        personalTransactionsService.list(userId, txFilters),
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

      const income = txs.filter((t) => t.direction === 'in').reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
      const expense = txs.filter((t) => t.direction === 'out').reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
      const net = income - expense;
      const savingsRate = income > 0 ? net / income : null;

      const categoryBreakdown = txs
        .filter((t) => t.direction === 'out')
        .reduce<Record<string, { total: number; count: number }>>((acc, tx) => {
          const key = tx.notes ?? tx.label ?? 'Uncategorized';
          if (!acc[key]) acc[key] = { total: 0, count: 0 };
          acc[key].total += Number(tx.amount ?? 0);
          acc[key].count += 1;
          return acc;
        }, {});

      const monthlySeries = txs.reduce<Record<string, { income: number; expense: number }>>((acc, tx) => {
        const d = tx.date ?? tx.date;
        const monthKey = `${tx.date.getUTCFullYear()}-${String(tx.date.getUTCMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthKey]) acc[monthKey] = { income: 0, expense: 0 };
        if (tx.direction === 'in') acc[monthKey].income += Number(tx.amount ?? 0);
        if (tx.direction === 'out') acc[monthKey].expense += Number(tx.amount ?? 0);
        return acc;
      }, {});

      const monthlySeriesArray = Object.entries(monthlySeries)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([monthKey, values]) => ({
          month: monthKey,
          income: values.income,
          expense: values.expense,
          net: values.income - values.expense,
        }));

      const categoryArray = Object.entries(categoryBreakdown).map(([name, values]) => ({
        name,
        total: values.total,
        count: values.count,
      }));

      return reply.send({
        data: {
          summary: {
            totalNetWorth: insights.totalBalance ?? 0,
            totalCash: insights.totalBalance ?? 0,
            monthIncome: insights.monthIncome ?? income,
            monthExpense: insights.monthSpending ?? expense,
            monthNetCashflow: insights.monthNet ?? net,
            currency: insights.baseCurrency ?? 'EUR',
          },
          period: {
            from: fromDate ? fromDate.toISOString() : null,
            to: toDate ? toDate.toISOString() : null,
            income,
            expense,
            net,
            savingsRate,
          },
          series: monthlySeriesArray,
          categories: categoryArray,
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
