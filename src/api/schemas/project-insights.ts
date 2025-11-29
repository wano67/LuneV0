import { z } from 'zod';

export const projectInsightsTaskStatsSchema = z.object({
  total: z.number(),
  todo: z.number(),
  inProgress: z.number(),
  blocked: z.number(),
  done: z.number(),
});

export const projectInsightsProgressSchema = z.object({
  progressPct: z.number(),
  weighted: z.boolean(),
});

export const projectInsightsRisksSchema = z.object({
  lateTasks: z.number(),
  upcomingDeadlines: z.number(),
  nextDeadline: z.string().nullable(),
});

export const projectInsightsRiskSignalsSchema = z.object({
  missingDates: z.object({
    count: z.number(),
    taskIds: z.array(z.string()),
  }),
  lateTasks: z.object({
    count: z.number(),
    taskIds: z.array(z.string()),
  }),
  blockingDependencies: z.object({
    count: z.number(),
    taskIds: z.array(z.string()),
  }),
  timeOverruns: z.object({
    count: z.number(),
    taskIds: z.array(z.string()),
  }),
});

export const projectInsightsGanttRangeSchema = z.object({
  start: z.string().nullable(),
  end: z.string().nullable(),
});

export const projectInsightsOverviewSchema = z.object({
  taskStats: projectInsightsTaskStatsSchema,
  progress: projectInsightsProgressSchema,
  risks: projectInsightsRisksSchema,
  ganttRange: projectInsightsGanttRangeSchema,
  riskSignals: projectInsightsRiskSignalsSchema,
  generatedAt: z.string(),
});
