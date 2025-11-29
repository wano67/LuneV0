import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  projectSchema,
  projectListSchema,
  createProjectBodySchema,
  updateProjectBodySchema,
} from '@/api/schemas/project';
import { projectsService, type ProjectSummary } from '@/modules/project/project.service';
import { normalizeBusinessId, normalizeClientId, normalizeProjectId } from '@/modules/shared/ids';

const decimalToNumber = (value: { toNumber: () => number } | number | null): number | null => {
  if (value === null) return null;
  return typeof value === 'number' ? value : value.toNumber();
};

const parseDate = (value?: string | null): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
};

const toProjectDto = (project: ProjectSummary) => ({
  id: project.id.toString(),
  userId: project.user_id.toString(),
  businessId: project.business_id ? project.business_id.toString() : null,
  clientId: project.client_id ? project.client_id.toString() : null,
  name: project.name,
  description: project.description,
  status: project.status,
  startDate: project.start_date ? project.start_date.toISOString() : null,
  dueDate: project.due_date ? project.due_date.toISOString() : null,
  completedAt: project.completed_at ? project.completed_at.toISOString() : null,
  budgetAmount: decimalToNumber(project.budget_amount as any),
  currency: project.currency,
  priority: project.priority,
  progressManualPct: project.progress_manual_pct ?? null,
  progressAutoMode: project.progress_auto_mode ?? null,
  createdAt: project.created_at.toISOString(),
  updatedAt: project.updated_at.toISOString(),
});

export async function registerProjectRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'POST',
    url: '/api/v1/businesses/:businessId/projects',
    schema: {
      tags: ['Business – Projects'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      body: createProjectBodySchema,
      response: {
        201: z.object({ data: projectSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const project = await projectsService.createProject({
        userId,
        businessId,
        clientId:
          request.body.clientId === undefined || request.body.clientId === null
            ? request.body.clientId ?? null
            : normalizeClientId(BigInt(request.body.clientId)),
        name: request.body.name,
        description: request.body.description ?? undefined,
        currency: request.body.currency ?? undefined,
        status: request.body.status as any,
        startDate: request.body.startDate ? new Date(request.body.startDate) : undefined,
        dueDate: request.body.dueDate ? new Date(request.body.dueDate) : undefined,
        priority: request.body.priority as any,
        budgetAmount: request.body.budgetAmount ?? undefined,
        services: request.body.services?.map((svc) => ({
          serviceId: BigInt(svc.serviceId),
          quantity: svc.quantity,
          customLabel: svc.customLabel,
        })),
      });

      return reply.code(201).send({ data: toProjectDto(project.project) });
    },
  });

  server.route({
    method: 'GET',
    url: '/api/v1/businesses/:businessId/projects',
    schema: {
      tags: ['Business – Projects'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: projectListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const projects = await projectsService.listProjectsForUser(userId, { businessId });

      return reply.send({ data: projects.map((p) => toProjectDto(p.project)) });
    },
  });

  server.route({
    method: 'GET',
    url: '/api/v1/projects/:projectId',
    schema: {
      tags: ['Business – Projects'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      response: {
        200: z.object({ data: projectSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const projectId = normalizeProjectId(BigInt(request.params.projectId));

      const project = await projectsService.getProjectWithDetails(projectId, userId);

      return reply.send({ data: toProjectDto(project.project) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/api/v1/projects/:projectId',
    schema: {
      tags: ['Business – Projects'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      body: updateProjectBodySchema,
      response: {
        200: z.object({ data: projectSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const projectId = normalizeProjectId(BigInt(request.params.projectId));
      const body = request.body;

      const updated = await projectsService.updateProject(projectId, userId, {
        name: body.name,
        description: body.description,
        status: body.status as any,
        startDate: parseDate(body.startDate) ?? undefined,
        dueDate: parseDate(body.dueDate) ?? undefined,
        completedAt: parseDate(body.completedAt),
        budgetAmount: body.budgetAmount === undefined ? undefined : body.budgetAmount,
        currency: body.currency,
        priority: body.priority as any,
        progressManualPct: body.progressManualPct === undefined ? undefined : body.progressManualPct,
        progressAutoMode: body.progressAutoMode as any,
        clientId:
          body.clientId === undefined || body.clientId === null
            ? body.clientId ?? undefined
            : normalizeClientId(BigInt(body.clientId)),
      });

      return reply.send({ data: toProjectDto(updated.project) });
    },
  });

  server.route({
    method: 'DELETE',
    url: '/api/v1/projects/:projectId',
    schema: {
      tags: ['Business – Projects'],
      security: [{ bearerAuth: [] }],
      params: z.object({ projectId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const projectId = normalizeProjectId(BigInt(request.params.projectId));

      await projectsService.deleteProject(projectId, userId);
      return reply.code(204).send(null);
    },
  });
}
