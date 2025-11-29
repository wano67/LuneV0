import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  projectTaskSchema,
  projectTaskListSchema,
  createProjectTaskBodySchema,
  updateProjectTaskBodySchema,
} from '@/api/schemas/project-task';
import { projectTasksService } from '@/modules/project/project-tasks.service';
import { normalizeProjectId, normalizeUserId } from '@/modules/shared/ids';

const parseDateOnly = (value?: string | null): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(`${value}T00:00:00.000Z`);
};

const decimalToNumber = (value: any): number | null => {
  if (value == null) return null;
  return typeof value === 'number' ? value : value.toNumber();
};

const toTaskDto = (task: any) => ({
  id: task.id.toString(),
  projectId: task.project_id.toString(),
  name: task.name,
  description: task.description,
  status: task.status,
  startDate: task.start_date ? task.start_date.toISOString() : null,
  dueDate: task.due_date ? task.due_date.toISOString() : null,
  completedAt: task.completed_at ? task.completed_at.toISOString() : null,
  progressPct: task.progress_pct,
  sortIndex: task.sort_index,
  estimatedHours: decimalToNumber(task.estimated_hours),
  actualHours: decimalToNumber(task.actual_hours),
  createdAt: task.created_at.toISOString(),
  updatedAt: task.updated_at.toISOString(),
});

export async function registerProjectTaskRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/api/v1/projects/:projectId/tasks',
    schema: {
      tags: ['Business – Project Tasks'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      response: {
        200: z.object({ data: projectTaskListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const projectId = normalizeProjectId(BigInt(request.params.projectId));

      const tasks = await projectTasksService.listForProject(userId, projectId);
      return reply.send({ data: tasks.map(toTaskDto) });
    },
  });

  server.route({
    method: 'POST',
    url: '/api/v1/projects/:projectId/tasks',
    schema: {
      tags: ['Business – Project Tasks'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      body: createProjectTaskBodySchema,
      response: {
        201: z.object({ data: projectTaskSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const projectId = normalizeProjectId(BigInt(request.params.projectId));
      const body = request.body;

      const task = await projectTasksService.createForProject({
        userId,
        projectId,
        name: body.name,
        description: body.description ?? null,
        status: body.status,
        startDate: parseDateOnly(body.startDate),
        dueDate: parseDateOnly(body.dueDate),
        progressPct: body.progressPct,
        sortIndex: body.sortIndex,
        estimatedHours: body.estimatedHours ?? null,
      });

      return reply.code(201).send({ data: toTaskDto(task) });
    },
  });

  server.route({
    method: 'GET',
    url: '/api/v1/tasks/:taskId',
    schema: {
      tags: ['Business – Project Tasks'],
      security: [{ bearerAuth: [] }],
      params: z.object({ taskId: z.string() }),
      response: {
        200: z.object({ data: projectTaskSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const taskId = BigInt(request.params.taskId);

      const task = await projectTasksService.getForProject(taskId, userId);
      return reply.send({ data: toTaskDto(task) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/api/v1/tasks/:taskId',
    schema: {
      tags: ['Business – Project Tasks'],
      security: [{ bearerAuth: [] }],
      params: z.object({ taskId: z.string() }),
      body: updateProjectTaskBodySchema,
      response: {
        200: z.object({ data: projectTaskSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const taskId = BigInt(request.params.taskId);
      const body = request.body;

      const updated = await projectTasksService.updateTask(taskId, userId, {
        name: body.name,
        description: body.description ?? null,
        status: body.status,
        startDate: parseDateOnly(body.startDate),
        dueDate: parseDateOnly(body.dueDate),
        completedAt: parseDateOnly(body.completedAt),
        progressPct: body.progressPct,
        sortIndex: body.sortIndex,
        estimatedHours: body.estimatedHours ?? undefined,
        actualHours: body.actualHours ?? undefined,
      });

      return reply.send({ data: toTaskDto(updated) });
    },
  });

  server.route({
    method: 'DELETE',
    url: '/api/v1/tasks/:taskId',
    schema: {
      tags: ['Business – Project Tasks'],
      security: [{ bearerAuth: [] }],
      params: z.object({ taskId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const taskId = BigInt(request.params.taskId);

      await projectTasksService.deleteTask(taskId, userId);
      return reply.code(204).send(null);
    },
  });
}
