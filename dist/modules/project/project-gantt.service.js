"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectGanttService = exports.ProjectGanttService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
class ProjectGanttService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    decimalToNumber(value) {
        if (value == null)
            return 0;
        if (typeof value === 'number')
            return value;
        if (typeof value.toNumber === 'function')
            return value.toNumber();
        return Number(value);
    }
    async getGantt(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const projectId = (0, ids_1.normalizeProjectId)(options.projectId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const project = await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectId, userId);
        const tasks = await this.prismaClient.projectTask.findMany({
            where: { project_id: projectId },
            select: {
                id: true,
                project_id: true,
                parent_task_id: true,
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
                dependencies: {
                    select: { depends_on: true },
                },
            },
            orderBy: [{ start_date: 'asc' }, { sort_index: 'asc' }, { id: 'asc' }],
        });
        let totalEstimated = 0;
        let totalActual = 0;
        for (const t of tasks) {
            totalEstimated += this.decimalToNumber(t.estimated_hours);
            totalActual += this.decimalToNumber(t.actual_hours);
        }
        let startDate = project.start_date ?? null;
        let dueDate = project.due_date ?? null;
        let completedAt = project.completed_at ?? null;
        for (const t of tasks) {
            const s = t.start_date;
            const d = t.due_date;
            const c = t.completed_at;
            if (s && (!startDate || s < startDate))
                startDate = s;
            if (d && (!dueDate || d > dueDate))
                dueDate = d;
            if (c && (!completedAt || c > completedAt))
                completedAt = c;
        }
        const tasksDto = tasks.map((t) => ({
            id: t.id.toString(),
            projectId: t.project_id.toString(),
            name: t.name,
            description: t.description,
            status: ['todo', 'in_progress', 'blocked', 'done'].includes(t.status)
                ? t.status
                : 'todo',
            startDate: t.start_date ? t.start_date.toISOString() : null,
            dueDate: t.due_date ? t.due_date.toISOString() : null,
            completedAt: t.completed_at ? t.completed_at.toISOString() : null,
            progressPct: t.progress_pct ?? 0,
            sortIndex: t.sort_index ?? 0,
            estimatedHours: t.estimated_hours ? this.decimalToNumber(t.estimated_hours) : null,
            actualHours: t.actual_hours ? this.decimalToNumber(t.actual_hours) : null,
            parentTaskId: t.parent_task_id ? t.parent_task_id.toString() : null,
            dependencyIds: t.dependencies.map((dep) => dep.depends_on.toString()),
            createdAt: t.created_at.toISOString(),
            updatedAt: t.updated_at.toISOString(),
        }));
        const progressMode = project.progress_auto_mode ?? 'manual';
        const progressPct = project.progress_manual_pct ?? 0;
        return {
            projectId: projectId.toString(),
            name: project.name ?? '',
            status: project.status ?? '',
            startDate: startDate ? startDate.toISOString() : null,
            dueDate: dueDate ? dueDate.toISOString() : null,
            completedAt: completedAt ? completedAt.toISOString() : null,
            progressMode,
            progressPct,
            totalEstimatedHours: totalEstimated,
            totalActualHours: totalActual,
            tasks: tasksDto,
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.ProjectGanttService = ProjectGanttService;
exports.projectGanttService = new ProjectGanttService(prisma_1.prisma);
