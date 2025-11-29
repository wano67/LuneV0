import { z } from 'zod';

export const projectGanttTaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']),
  startDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  completedAt: z.string().nullable(),
  progressPct: z.number().min(0).max(100),
  sortIndex: z.number(),
  estimatedHours: z.number().nullable(),
  actualHours: z.number().nullable(),
  parentTaskId: z.string().nullable(),
  dependencyIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const projectGanttOverviewSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  status: z.string(),
  startDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  completedAt: z.string().nullable(),
  progressMode: z.string().nullable(),
  progressPct: z.number().min(0).max(150),
  totalEstimatedHours: z.number(),
  totalActualHours: z.number(),
  tasks: z.array(projectGanttTaskSchema),
  generatedAt: z.string(),
});

export type ProjectGanttOverviewDto = z.infer<typeof projectGanttOverviewSchema>;
