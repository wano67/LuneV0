import { z } from 'zod';

export const serviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  unit: z.enum(['project', 'day', 'hour', 'deliverable']),
  unitPrice: z.number(),
  currency: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const serviceListSchema = z.array(serviceSchema);

export const createServiceBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  unit: z.enum(['project', 'day', 'hour', 'deliverable']),
  unitPrice: z.number(),
  currency: z.string().min(1),
});

export const updateServiceBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  unit: z.enum(['project', 'day', 'hour', 'deliverable']).optional(),
  unitPrice: z.number().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});
