import { z } from 'zod';

export const projectTaskTimeInsightSchema = z.object({
  taskId: z.string(),
  name: z.string(),
  status: z.string(),
  estimatedHours: z.number().nullable(),
  actualHours: z.number().nullable(),
  ratio: z.number().nullable(), // actual / estimated
});

export type ProjectTaskTimeInsightDto = z.infer<typeof projectTaskTimeInsightSchema>;
