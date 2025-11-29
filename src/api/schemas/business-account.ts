import { z } from 'zod';

export const businessAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string(),
  name: z.string(),
  type: z.string(),
  currency: z.string(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const businessAccountListSchema = z.array(businessAccountSchema);

export const createBusinessAccountBodySchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  currency: z.string().min(1).default('EUR'),
  initialBalance: z.number().optional(),
});

export const updateBusinessAccountBodySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
});
