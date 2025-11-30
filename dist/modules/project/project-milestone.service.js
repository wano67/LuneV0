"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectMilestoneService = exports.ProjectMilestoneService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const errors_1 = require("@/modules/shared/errors");
const milestoneSelect = {
    id: true,
    project_id: true,
    name: true,
    description: true,
    due_date: true,
    status: true,
    order_index: true,
    weight_pct: true,
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
class ProjectMilestoneService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async addMilestone(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const projectId = (0, ids_1.normalizeProjectId)(input.projectId);
        await assertProjectOwnedByUser(this.prismaClient, projectId, userId);
        const currentCount = await this.prismaClient.projectMilestone.count({ where: { project_id: projectId } });
        const milestone = await this.prismaClient.projectMilestone.create({
            data: {
                project_id: projectId,
                name: input.name.trim(),
                description: input.description ?? null,
                due_date: input.dueDate ?? null,
                status: 'not_started',
                order_index: currentCount,
                weight_pct: input.weightPct ?? null,
            },
            select: milestoneSelect,
        });
        return milestone;
    }
    async updateMilestone(milestoneIdInput, userIdInput, input) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const milestoneId = (0, ids_1.normalizeProjectMilestoneId)(milestoneIdInput);
        const existing = await this.prismaClient.projectMilestone.findUnique({
            where: { id: milestoneId },
            select: { ...milestoneSelect, project: { select: { id: true, user_id: true } } },
        });
        if (!existing)
            throw new errors_1.ProjectNotFoundError('Milestone not found');
        if (existing.project.user_id !== userId)
            throw new errors_1.ProjectOwnershipError();
        const data = {};
        if (input.name !== undefined)
            data.name = input.name.trim();
        if (input.description !== undefined)
            data.description = input.description;
        if (input.dueDate !== undefined)
            data.due_date = input.dueDate;
        if (input.status !== undefined)
            data.status = input.status;
        if (input.orderIndex !== undefined)
            data.order_index = input.orderIndex;
        if (input.weightPct !== undefined)
            data.weight_pct = input.weightPct;
        const updated = await this.prismaClient.projectMilestone.update({
            where: { id: milestoneId },
            data,
            select: milestoneSelect,
        });
        return updated;
    }
    async listMilestonesForProject(projectIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const projectId = (0, ids_1.normalizeProjectId)(projectIdInput);
        await assertProjectOwnedByUser(this.prismaClient, projectId, userId);
        return this.prismaClient.projectMilestone.findMany({
            where: { project_id: projectId },
            select: milestoneSelect,
            orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
        });
    }
}
exports.ProjectMilestoneService = ProjectMilestoneService;
exports.projectMilestoneService = new ProjectMilestoneService(prisma_1.prisma);
