import { z } from 'zod';

export const personalSpendingByCategorySchema = z.object({
  period: z.object({ from: z.string(), to: z.string() }),
  currency: z.string(),
  categories: z.array(
    z.object({
      category: z.string(),
      total: z.number(),
      transactionCount: z.number(),
      shareOfSpending: z.number(),
    }),
  ),
  topCategory: z.string().nullable(),
  generatedAt: z.string(),
});

export type PersonalSpendingByCategoryDto = z.infer<typeof personalSpendingByCategorySchema>;
