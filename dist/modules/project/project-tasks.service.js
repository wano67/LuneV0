"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectTasksService = exports.ProjectTasksService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
const projectTaskSelect = {
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
class ProjectTasksService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async listForProject(userIdInput, projectIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const projectId = (0, ids_1.normalizeProjectId)(projectIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectId, userId);
        return this.prismaClient.projectTask.findMany({
            where: { project_id: projectId },
            select: projectTaskSelect,
            orderBy: [{ start_date: 'asc' }, { sort_index: 'asc' }, { id: 'asc' }],
        });
    }
    async createForProject(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const projectId = (0, ids_1.normalizeProjectId)(input.projectId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectId, userId);
        const created = await this.prismaClient.projectTask.create({
            data: {
                project_id: projectId,
                name: input.name,
                description: input.description ?? null,
                status: input.status ?? 'todo',
                start_date: input.startDate ?? null,
                due_date: input.dueDate ?? null,
                progress_pct: input.progressPct ?? 0,
                sort_index: input.sortIndex ?? 0,
                estimated_hours: input.estimatedHours != null ? new client_1.Prisma.Decimal(input.estimatedHours) : null,
            },
            select: projectTaskSelect,
        });
        return created;
    }
    async getForProject(taskIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const taskId = BigInt(taskIdInput);
        const task = await this.prismaClient.projectTask.findUnique({
            where: { id: taskId },
            select: {
                ...projectTaskSelect,
                project: { select: { id: true, user_id: true } },
            },
        });
        if (!task) {
            throw new errors_1.ProjectTaskNotFoundError();
        }
        if (task.project.user_id !== userId) {
            throw new errors_1.ProjectTaskOwnershipError();
        }
        const { project, ...rest } = task;
        return rest;
    }
    async updateTask(taskIdInput, userIdInput, updates) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const taskId = BigInt(taskIdInput);
        const existing = await this.prismaClient.projectTask.findUnique({
            where: { id: taskId },
            select: {
                ...projectTaskSelect,
                project: { select: { id: true, user_id: true } },
            },
        });
        if (!existing) {
            throw new errors_1.ProjectTaskNotFoundError();
        }
        if (existing.project.user_id !== userId) {
            throw new errors_1.ProjectTaskOwnershipError();
        }
        const data = {};
        if (updates.name !== undefined)
            data.name = updates.name;
        if (updates.description !== undefined)
            data.description = updates.description;
        if (updates.status !== undefined)
            data.status = updates.status;
        if (updates.startDate !== undefined)
            data.start_date = updates.startDate;
        if (updates.dueDate !== undefined)
            data.due_date = updates.dueDate;
        if (updates.completedAt !== undefined)
            data.completed_at = updates.completedAt;
        if (updates.progressPct !== undefined)
            data.progress_pct = updates.progressPct;
        if (updates.sortIndex !== undefined)
            data.sort_index = updates.sortIndex;
        if (updates.estimatedHours !== undefined) {
            data.estimated_hours =
                updates.estimatedHours == null ? null : new client_1.Prisma.Decimal(updates.estimatedHours);
        }
        if (updates.actualHours !== undefined) {
            data.actual_hours =
                updates.actualHours == null ? null : new client_1.Prisma.Decimal(updates.actualHours);
        }
        const updated = await this.prismaClient.projectTask.update({
            where: { id: taskId },
            data,
            select: projectTaskSelect,
        });
        return updated;
    }
    async deleteTask(taskIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const taskId = BigInt(taskIdInput);
        const existing = await this.prismaClient.projectTask.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                project: { select: { id: true, user_id: true } },
            },
        });
        if (!existing) {
            throw new errors_1.ProjectTaskNotFoundError();
        }
        if (existing.project.user_id !== userId) {
            throw new errors_1.ProjectTaskOwnershipError();
        }
        await this.prismaClient.projectTask.delete({ where: { id: taskId } });
    }
}
exports.ProjectTasksService = ProjectTasksService;
exports.projectTasksService = new ProjectTasksService(prisma_1.prisma);
