"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectTaskService = exports.ProjectTaskService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const errors_1 = require("@/modules/shared/errors");
const taskSelect = {
    id: true,
    project_id: true,
    name: true,
    description: true,
    status: true,
    start_date: true,
    due_date: true,
    completed_at: true,
    progress_pct: true,
    sort_index: true,
    estimated_hours: true,
    actual_hours: true,
    created_at: true,
    updated_at: true,
};
async function assertProjectOwnedByUser(prismaClient, projectId, userId) {
    const project = await prismaClient.project.findUnique({
        where: { id: projectId },
        select: { id: true, user_id: true },
    });
    if (!project)
        throw new errors_1.ProjectNotFoundError();
    if (project.user_id !== userId)
        throw new errors_1.ProjectOwnershipError();
}
class ProjectTaskService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async addTask(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const projectId = (0, ids_1.normalizeProjectId)(input.projectId);
        await assertProjectOwnedByUser(this.prismaClient, projectId, userId);
        const currentCount = await this.prismaClient.projectTask.count({ where: { project_id: projectId } });
        const task = await this.prismaClient.projectTask.create({
            data: {
                project_id: projectId,
                name: input.title.trim(),
                description: input.description ?? null,
                status: 'todo',
                start_date: input.startDate ?? null,
                due_date: input.dueDate ?? null,
                progress_pct: input.progressPct ?? 0,
                sort_index: input.sortIndex ?? currentCount,
                estimated_hours: input.estimatedHours != null ? new client_1.Prisma.Decimal(input.estimatedHours) : null,
            },
            select: taskSelect,
        });
        return task;
    }
    async updateTask(taskIdInput, userIdInput, input) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const taskId = (0, ids_1.normalizeProjectTaskId)(taskIdInput);
        const existing = await this.prismaClient.projectTask.findUnique({
            where: { id: taskId },
            select: { ...taskSelect, project: { select: { id: true, user_id: true } } },
        });
        if (!existing)
            throw new errors_1.ProjectNotFoundError('Task not found');
        if (existing.project.user_id !== userId)
            throw new errors_1.ProjectOwnershipError();
        const data = {};
        if (input.title !== undefined)
            data.name = input.title.trim();
        if (input.description !== undefined)
            data.description = input.description;
        if (input.status !== undefined)
            data.status = input.status;
        if (input.dueDate !== undefined)
            data.due_date = input.dueDate;
        if (input.startDate !== undefined)
            data.start_date = input.startDate;
        if (input.completedAt !== undefined)
            data.completed_at = input.completedAt;
        if (input.progressPct !== undefined)
            data.progress_pct = input.progressPct;
        if (input.sortIndex !== undefined)
            data.sort_index = input.sortIndex;
        if (input.estimatedHours !== undefined) {
            data.estimated_hours = input.estimatedHours == null ? null : new client_1.Prisma.Decimal(input.estimatedHours);
        }
        if (input.actualHours !== undefined) {
            data.actual_hours = input.actualHours == null ? null : new client_1.Prisma.Decimal(input.actualHours);
        }
        const updated = await this.prismaClient.projectTask.update({
            where: { id: taskId },
            data,
            select: taskSelect,
        });
        return updated;
    }
    async listTasksForProject(projectIdInput, userIdInput, filters = {}) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const projectId = (0, ids_1.normalizeProjectId)(projectIdInput);
        await assertProjectOwnedByUser(this.prismaClient, projectId, userId);
        const where = { project_id: projectId };
        if (filters.status) {
            where.status = filters.status;
        }
        return this.prismaClient.projectTask.findMany({
            where,
            select: taskSelect,
            orderBy: [{ sort_index: 'asc' }, { id: 'asc' }],
        });
    }
}
exports.ProjectTaskService = ProjectTaskService;
exports.projectTaskService = new ProjectTaskService(prisma_1.prisma);
