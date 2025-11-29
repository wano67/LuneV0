import { z } from 'zod';

const dateOnlyStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');

export const businessTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string(),
  accountId: z.string(),
  direction: z.enum(['in', 'out']),
  amount: z.number(),
  currency: z.string(),
  occurredAt: z.string(),
  label: z.string(),
  category: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const businessTransactionListSchema = z.array(businessTransactionSchema);

export const createBusinessTransactionBodySchema = z.object({
  accountId: z.string(),
  direction: z.enum(['in', 'out']),
  amount: z.number().positive(),
  currency: z.string().optional(),
  occurredAt: dateOnlyStringSchema,
  label: z.string().min(1),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateBusinessTransactionBodySchema = z.object({
  accountId: z.string().optional(),
  direction: z.enum(['in', 'out']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  occurredAt: dateOnlyStringSchema.optional(),
  label: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listBusinessTransactionsQuerySchema = z.object({
  accountId: z.string().optional(),
  dateFrom: dateOnlyStringSchema.optional(),
  dateTo: dateOnlyStringSchema.optional(),
  direction: z.enum(['in', 'out']).optional(),
});
