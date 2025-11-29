import { z } from 'zod';

export const quoteLineSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  serviceId: z.string().nullable(),
  description: z.string(),
  quantity: z.number(),
  unit: z.string().nullable(),
  unitPrice: z.number(),
  vatRate: z.number().nullable(),
  discountPct: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const quoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string(),
  clientId: z.string(),
  projectId: z.string().nullable(),
  quoteNumber: z.string(),
  status: z.string(),
  title: z.string().nullable(),
  currency: z.string(),
  subtotalHt: z.number(),
  discountTotal: z.number(),
  vatTotal: z.number(),
  totalHt: z.number(),
  totalTtc: z.number(),
  validUntil: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const quoteWithItemsSchema = z.object({
  quote: quoteSchema,
  items: z.array(quoteLineSchema),
});

export const quoteListSchema = z.array(quoteWithItemsSchema);

export const createQuoteLineInputSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().optional(),
  vatRate: z.number().nullable().optional(),
});

export const dateOnlyStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/,'Invalid date format, expected YYYY-MM-DD');

export const createQuoteBodySchema = z.object({
  clientId: z.string(),
  projectId: z.string().nullable().optional(),
  title: z.string().optional(),
  currency: z.string().optional(),
  validUntil: dateOnlyStringSchema.optional(),
  notes: z.string().optional(),
  items: z.array(createQuoteLineInputSchema).min(1),
});

export const updateQuoteBodySchema = z.object({
  status: z.enum(['draft','sent','accepted','rejected','expired']).optional(),
  notes: z.string().nullable().optional(),
  issueDate: dateOnlyStringSchema.optional(),
  validUntil: dateOnlyStringSchema.nullable().optional(),
  items: z.array(createQuoteLineInputSchema).min(1).optional(),
});
