"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProjectTaskRoutes = registerProjectTaskRoutes;
const zod_1 = require("zod");
const project_task_1 = require("@/api/schemas/project-task");
const project_tasks_service_1 = require("@/modules/project/project-tasks.service");
const ids_1 = require("@/modules/shared/ids");
const parseDateOnly = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    return new Date(`${value}T00:00:00.000Z`);
};
const decimalToNumber = (value) => {
    if (value == null)
        return null;
    return typeof value === 'number' ? value : value.toNumber();
};
const toTaskDto = (task) => ({
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
async function registerProjectTaskRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/projects/:projectId/tasks',
        schema: {
            tags: ['Business – Project Tasks'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: project_task_1.projectTaskListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            const tasks = await project_tasks_service_1.projectTasksService.listForProject(userId, projectId);
            return reply.send({ data: tasks.map(toTaskDto) });
        },
    });
    server.route({
        method: 'POST',
        url: '/api/v1/projects/:projectId/tasks',
        schema: {
            tags: ['Business – Project Tasks'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            body: project_task_1.createProjectTaskBodySchema,
            response: {
                201: zod_1.z.object({ data: project_task_1.projectTaskSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            const body = request.body;
            const task = await project_tasks_service_1.projectTasksService.createForProject({
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
            params: zod_1.z.object({ taskId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: project_task_1.projectTaskSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const taskId = BigInt(request.params.taskId);
            const task = await project_tasks_service_1.projectTasksService.getForProject(taskId, userId);
            return reply.send({ data: toTaskDto(task) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/api/v1/tasks/:taskId',
        schema: {
            tags: ['Business – Project Tasks'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ taskId: zod_1.z.string() }),
            body: project_task_1.updateProjectTaskBodySchema,
            response: {
                200: zod_1.z.object({ data: project_task_1.projectTaskSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const taskId = BigInt(request.params.taskId);
            const body = request.body;
            const updated = await project_tasks_service_1.projectTasksService.updateTask(taskId, userId, {
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
            params: zod_1.z.object({ taskId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const taskId = BigInt(request.params.taskId);
            await project_tasks_service_1.projectTasksService.deleteTask(taskId, userId);
            return reply.code(204).send(null);
        },
    });
}
