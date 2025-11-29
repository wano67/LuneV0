import { z } from 'zod';

export const businessPipelineInsightsSchema = z.object({
  businessId: z.string(),
  quoteCount: z.number(),
  acceptedCount: z.number(),
  conversionRate: z.number(), // 0..1
  avgTimeToAcceptDays: z.number(), // 0 si aucun
  totalQuoted: z.number(),
  totalAccepted: z.number(),
  generatedAt: z.string(),
});

export type BusinessPipelineInsightsDto = z.infer<typeof businessPipelineInsightsSchema>;
