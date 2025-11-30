"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProjectRoutes = registerProjectRoutes;
const zod_1 = require("zod");
const project_1 = require("@/api/schemas/project");
const project_service_1 = require("@/modules/project/project.service");
const ids_1 = require("@/modules/shared/ids");
const decimalToNumber = (value) => {
    if (value === null)
        return null;
    return typeof value === 'number' ? value : value.toNumber();
};
const parseDate = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    return new Date(value);
};
const toProjectDto = (project) => ({
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
    budgetAmount: decimalToNumber(project.budget_amount),
    currency: project.currency,
    priority: project.priority,
    progressManualPct: project.progress_manual_pct ?? null,
    progressAutoMode: project.progress_auto_mode ?? null,
    createdAt: project.created_at.toISOString(),
    updatedAt: project.updated_at.toISOString(),
});
async function registerProjectRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'POST',
        url: '/api/v1/businesses/:businessId/projects',
        schema: {
            tags: ['Business – Projects'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: project_1.createProjectBodySchema,
            response: {
                201: zod_1.z.object({ data: project_1.projectSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const project = await project_service_1.projectsService.createProject({
                userId,
                businessId,
                clientId: request.body.clientId === undefined || request.body.clientId === null
                    ? request.body.clientId ?? null
                    : (0, ids_1.normalizeClientId)(BigInt(request.body.clientId)),
                name: request.body.name,
                description: request.body.description ?? undefined,
                currency: request.body.currency ?? undefined,
                status: request.body.status,
                startDate: request.body.startDate ? new Date(request.body.startDate) : undefined,
                dueDate: request.body.dueDate ? new Date(request.body.dueDate) : undefined,
                priority: request.body.priority,
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
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: project_1.projectListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const projects = await project_service_1.projectsService.listProjectsForUser(userId, { businessId });
            return reply.send({ data: projects.map((p) => toProjectDto(p.project)) });
        },
    });
    server.route({
        method: 'GET',
        url: '/api/v1/projects/:projectId',
        schema: {
            tags: ['Business – Projects'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: project_1.projectSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            const project = await project_service_1.projectsService.getProjectWithDetails(projectId, userId);
            return reply.send({ data: toProjectDto(project.project) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/api/v1/projects/:projectId',
        schema: {
            tags: ['Business – Projects'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            body: project_1.updateProjectBodySchema,
            response: {
                200: zod_1.z.object({ data: project_1.projectSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            const body = request.body;
            const updated = await project_service_1.projectsService.updateProject(projectId, userId, {
                name: body.name,
                description: body.description,
                status: body.status,
                startDate: parseDate(body.startDate) ?? undefined,
                dueDate: parseDate(body.dueDate) ?? undefined,
                completedAt: parseDate(body.completedAt),
                budgetAmount: body.budgetAmount === undefined ? undefined : body.budgetAmount,
                currency: body.currency,
                priority: body.priority,
                progressManualPct: body.progressManualPct === undefined ? undefined : body.progressManualPct,
                progressAutoMode: body.progressAutoMode,
                clientId: body.clientId === undefined || body.clientId === null
                    ? body.clientId ?? undefined
                    : (0, ids_1.normalizeClientId)(BigInt(body.clientId)),
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
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            await project_service_1.projectsService.deleteProject(projectId, userId);
            return reply.code(204).send(null);
        },
    });
}
