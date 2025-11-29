import { z } from 'zod';

export const dateOnlyStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');

export const businessBudgetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string(),
  name: z.string(),
  currency: z.string(),
  amount: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const businessBudgetListSchema = z.array(businessBudgetSchema);

export const createBusinessBudgetBodySchema = z.object({
  name: z.string().min(1),
  currency: z.string().min(1).default('EUR'),
  amount: z.number().positive(),
  periodStart: dateOnlyStringSchema,
  periodEnd: dateOnlyStringSchema,
});

export const updateBusinessBudgetBodySchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  periodStart: dateOnlyStringSchema.optional(),
  periodEnd: dateOnlyStringSchema.optional(),
});
