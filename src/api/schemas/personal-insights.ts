import { z } from 'zod';

export const personalInsightsMonthlyPointSchema = z.object({
  month: z.string(), // "2025-12"
  income: z.number(),
  spending: z.number(),
  net: z.number(),
});

export const personalInsightsBudgetSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  amount: z.number(),
  spent: z.number(),
  remaining: z.number(),
  consumptionRate: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export const personalInsightsOverviewSchema = z.object({
  totalBalance: z.number(),
  totalAccounts: z.number(),
  baseCurrency: z.string(),
  month: z.string(),
  monthIncome: z.number(),
  monthSpending: z.number(),
  monthNet: z.number(),
  last3Months: z.array(personalInsightsMonthlyPointSchema),
  budgets: z.array(personalInsightsBudgetSnapshotSchema),
  generatedAt: z.string(),
});

export type PersonalInsightsOverviewDto = z.infer<typeof personalInsightsOverviewSchema>;
