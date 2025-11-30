"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectWorkloadService = exports.ProjectWorkloadService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
class ProjectWorkloadService {
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
    startOfWeek(date) {
        const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const day = d.getUTCDay() || 7; // Sunday=0 -> 7
        d.setUTCDate(d.getUTCDate() - (day - 1));
        return d;
    }
    startOfMonth(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    }
    addDays(date, days) {
        const d = new Date(date.getTime());
        d.setUTCDate(d.getUTCDate() + days);
        return d;
    }
    addMonths(date, months) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
    }
    async getWorkload(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const projectId = (0, ids_1.normalizeProjectId)(options.projectId);
        const granularity = options.granularity ?? 'week';
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectId, userId);
        const tasks = await this.prismaClient.projectTask.findMany({
            where: { project_id: projectId },
            select: {
                id: true,
                name: true,
                status: true,
                start_date: true,
                due_date: true,
                completed_at: true,
                estimated_hours: true,
                actual_hours: true,
            },
            orderBy: [{ start_date: 'asc' }, { sort_index: 'asc' }, { id: 'asc' }],
        });
        let totalEstimated = 0;
        let totalActual = 0;
        for (const t of tasks) {
            totalEstimated += this.decimalToNumber(t.estimated_hours);
            totalActual += this.decimalToNumber(t.actual_hours);
        }
        const remaining = Math.max(totalEstimated - totalActual, 0);
        const completionRate = totalEstimated > 0 ? totalActual / totalEstimated : 0;
        const byStatusMap = new Map();
        const statuses = ['todo', 'in_progress', 'blocked', 'done'];
        for (const s of statuses) {
            byStatusMap.set(s, { estimatedHours: 0, actualHours: 0 });
        }
        for (const t of tasks) {
            const key = statuses.includes(t.status) ? t.status : 'todo';
            const bucket = byStatusMap.get(key);
            bucket.estimatedHours += this.decimalToNumber(t.estimated_hours);
            bucket.actualHours += this.decimalToNumber(t.actual_hours);
        }
        const byStatus = statuses.map((s) => {
            const b = byStatusMap.get(s);
            return {
                status: s,
                estimatedHours: b.estimatedHours,
                actualHours: b.actualHours,
            };
        });
        let minDate = null;
        let maxDate = null;
        for (const t of tasks) {
            const candidates = [t.start_date, t.due_date].filter(Boolean);
            for (const d of candidates) {
                if (!minDate || d < minDate)
                    minDate = d;
                if (!maxDate || d > maxDate)
                    maxDate = d;
            }
        }
        if (options.from)
            minDate = options.from;
        if (options.to)
            maxDate = options.to;
        let rangeStart = minDate;
        let rangeEnd = maxDate;
        if (!rangeStart || !rangeEnd) {
            return {
                projectId: projectId.toString(),
                totalEstimatedHours: totalEstimated,
                totalActualHours: totalActual,
                remainingHours: remaining,
                completionRate,
                granularity,
                rangeStart: null,
                rangeEnd: null,
                byStatus,
                byPeriod: [],
                topByActualHours: [],
                topByOverrun: [],
                generatedAt: new Date().toISOString(),
            };
        }
        if (granularity === 'week') {
            rangeStart = this.startOfWeek(rangeStart);
            rangeEnd = this.startOfWeek(rangeEnd);
        }
        else {
            rangeStart = this.startOfMonth(rangeStart);
            rangeEnd = this.startOfMonth(rangeEnd);
        }
        const byPeriod = [];
        let cursor = new Date(rangeStart.getTime());
        while (cursor <= rangeEnd) {
            let next;
            let periodKey;
            if (granularity === 'week') {
                next = this.addDays(cursor, 7);
                const year = cursor.getUTCFullYear();
                const jan1 = new Date(Date.UTC(year, 0, 1));
                const days = Math.floor((cursor.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const week = Math.ceil((days + (jan1.getUTCDay() === 0 ? 6 : jan1.getUTCDay() - 1)) / 7);
                periodKey = `${year}-W${String(week).padStart(2, '0')}`;
            }
            else {
                const year = cursor.getUTCFullYear();
                const month = cursor.getUTCMonth() + 1;
                periodKey = `${year}-${String(month).padStart(2, '0')}`;
                next = this.addMonths(cursor, 1);
            }
            const periodStart = new Date(cursor.getTime());
            const periodEnd = this.addDays(next, -1);
            byPeriod.push({
                periodKey,
                periodStart,
                periodEnd,
                estimatedHours: 0,
                actualHours: 0,
            });
            cursor = next;
        }
        for (const t of tasks) {
            const when = t.due_date ?? t.start_date;
            if (!when)
                continue;
            for (const bucket of byPeriod) {
                if (when >= bucket.periodStart && when <= bucket.periodEnd) {
                    bucket.estimatedHours += this.decimalToNumber(t.estimated_hours);
                    bucket.actualHours += this.decimalToNumber(t.actual_hours);
                    break;
                }
            }
        }
        const byPeriodDto = byPeriod.map((b) => ({
            periodKey: b.periodKey,
            periodStart: b.periodStart.toISOString(),
            periodEnd: b.periodEnd.toISOString(),
            estimatedHours: b.estimatedHours,
            actualHours: b.actualHours,
        }));
        const taskInsights = tasks.map((t) => {
            const estimated = this.decimalToNumber(t.estimated_hours);
            const actual = this.decimalToNumber(t.actual_hours);
            return {
                taskId: t.id.toString(),
                name: t.name,
                status: t.status,
                estimatedHours: t.estimated_hours != null ? estimated : null,
                actualHours: t.actual_hours != null ? actual : null,
                ratio: estimated > 0 ? actual / estimated : null,
            };
        });
        const topByActualHours = taskInsights
            .filter((t) => t.actualHours != null)
            .sort((a, b) => (b.actualHours ?? 0) - (a.actualHours ?? 0))
            .slice(0, 5);
        const topByOverrun = taskInsights
            .filter((t) => t.ratio != null)
            .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
            .slice(0, 5);
        return {
            projectId: projectId.toString(),
            totalEstimatedHours: totalEstimated,
            totalActualHours: totalActual,
            remainingHours: remaining,
            completionRate,
            granularity,
            rangeStart: rangeStart.toISOString(),
            rangeEnd: rangeEnd.toISOString(),
            byStatus,
            byPeriod: byPeriodDto,
            topByActualHours,
            topByOverrun,
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.ProjectWorkloadService = ProjectWorkloadService;
exports.projectWorkloadService = new ProjectWorkloadService(prisma_1.prisma);
