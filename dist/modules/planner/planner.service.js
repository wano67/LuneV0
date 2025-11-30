"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plannerService = exports.PlannerService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
class PlannerService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async getProjectTimeline(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const projectId = (0, ids_1.normalizeProjectId)(options.projectId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const project = await this.prismaClient.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                user_id: true,
                business_id: true,
                name: true,
                status: true,
                start_date: true,
                due_date: true,
                priority: true,
            },
        });
        if (!project)
            throw new errors_1.ProjectNotFoundError();
        if (project.user_id !== userId)
            throw new errors_1.ProjectOwnershipError();
        if (options.businessId !== undefined && project.business_id !== options.businessId) {
            throw new errors_1.ProjectOwnershipError();
        }
        const [tasks, milestones] = await Promise.all([
            this.prismaClient.projectTask.findMany({
                where: { project_id: projectId },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    due_date: true,
                    created_at: true,
                },
                orderBy: [{ due_date: 'asc' }, { id: 'asc' }],
            }),
            this.prismaClient.projectMilestone.findMany({
                where: { project_id: projectId },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    due_date: true,
                    weight_pct: true,
                },
                orderBy: [{ due_date: 'asc' }, { id: 'asc' }],
            }),
        ]);
        return {
            project,
            tasks: tasks.map((t) => ({
                id: t.id,
                title: t.name,
                status: t.status,
                startDate: undefined,
                dueDate: t.due_date ?? undefined,
                priority: undefined,
            })),
            milestones: milestones.map((m) => ({
                id: m.id,
                name: m.name,
                status: m.status,
                dueDate: m.due_date ?? new Date(),
                weightPct: m.weight_pct ?? undefined,
            })),
        };
    }
    async getUserWorkloadCalendar(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const fromDate = new Date(options.from);
        const toDate = new Date(options.to);
        const [tasks, milestones] = await Promise.all([
            this.prismaClient.projectTask.findMany({
                where: {
                    project: { user_id: userId },
                    due_date: { gte: fromDate, lte: toDate },
                },
                select: {
                    id: true,
                    project_id: true,
                    name: true,
                    status: true,
                    due_date: true,
                },
            }),
            this.prismaClient.projectMilestone.findMany({
                where: {
                    project: { user_id: userId },
                    due_date: { gte: fromDate, lte: toDate },
                },
                select: {
                    id: true,
                    project_id: true,
                    name: true,
                    status: true,
                    due_date: true,
                },
            }),
        ]);
        const dayMap = new Map();
        const addTask = (dateStr, task) => {
            const bucket = dayMap.get(dateStr) ?? { tasks: [], milestones: [] };
            bucket.tasks.push(task);
            dayMap.set(dateStr, bucket);
        };
        const addMilestone = (dateStr, milestone) => {
            const bucket = dayMap.get(dateStr) ?? { tasks: [], milestones: [] };
            bucket.milestones.push(milestone);
            dayMap.set(dateStr, bucket);
        };
        for (const t of tasks) {
            if (!t.due_date)
                continue;
            const dateStr = t.due_date.toISOString().slice(0, 10);
            addTask(dateStr, {
                projectId: t.project_id,
                taskId: t.id,
                title: t.name,
                status: t.status,
                priority: undefined,
            });
        }
        for (const m of milestones) {
            if (!m.due_date)
                continue;
            const dateStr = m.due_date.toISOString().slice(0, 10);
            addMilestone(dateStr, {
                projectId: m.project_id,
                milestoneId: m.id,
                name: m.name,
                status: m.status,
            });
        }
        const days = Array.from(dayMap.entries())
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([date, payload]) => ({ date, ...payload }));
        return { days };
    }
}
exports.PlannerService = PlannerService;
exports.plannerService = new PlannerService(prisma_1.prisma);
