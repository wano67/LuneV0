import { z } from 'zod';

export const clientSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string().nullable(),
  name: z.string(),
  type: z.enum(['individual', 'company']),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  companyName: z.string().nullable(),
  vatNumber: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const clientListSchema = z.array(clientSchema);

export const createClientBodySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['individual', 'company']),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(1).nullable().optional(),
  companyName: z.string().min(1).nullable().optional(),
  vatNumber: z.string().min(1).nullable().optional(),
  address: z.string().min(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateClientBodySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['individual', 'company']).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(1).nullable().optional(),
  companyName: z.string().min(1).nullable().optional(),
  vatNumber: z.string().min(1).nullable().optional(),
  address: z.string().min(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});
