"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastService = exports.ForecastService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
function formatMonth({ year, month }) {
    const mm = month.toString().padStart(2, '0');
    return `${year}-${mm}`;
}
function addMonths(start, delta) {
    const date = new Date(Date.UTC(start.year, start.month - 1, 1));
    date.setUTCMonth(date.getUTCMonth() + delta);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}
function getCurrentMonth() {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}
class ForecastService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    // --- Personal Forecast ---
    async computePersonalSavingsForecast(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const horizon = Math.max(1, Math.min(options.horizonMonths, 36));
        const startMonth = getCurrentMonth();
        const goals = await this.prismaClient.savings_goals.findMany({
            where: { user_id: userId, status: { in: ['active', 'paused'] } },
            select: { id: true, target_amount: true, current_amount_cached: true, target_date: true },
        });
        const recentSavings = await this.prismaClient.transactions.findMany({
            where: {
                user_id: userId,
                business_id: null,
                direction: 'out',
                category_id: { not: null },
                date: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
            },
            select: { amount: true, date: true },
        });
        const contributions = this.estimateContributionPerMonth(recentSavings, options.contributionsPerMonth);
        const months = [];
        let runningTotal = goals.reduce((sum, g) => sum + Number(g.current_amount_cached ?? 0), 0);
        for (let i = 0; i < horizon; i++) {
            const bucket = addMonths(startMonth, i);
            runningTotal += contributions;
            const goalsProgress = goals.map((goal) => {
                const projectedAmount = Math.min(goal.target_amount, Number(goal.current_amount_cached) + contributions);
                let projectedCompletionDate;
                if (projectedAmount >= Number(goal.target_amount) && goal.target_date) {
                    projectedCompletionDate = new Date(goal.target_date);
                }
                return {
                    goalId: goal.id,
                    targetAmount: Number(goal.target_amount),
                    projectedAmount,
                    projectedCompletionDate,
                };
            });
            months.push({
                month: formatMonth(bucket),
                projectedAmount: runningTotal,
                goalsProgress,
            });
        }
        return { months };
    }
    estimateContributionPerMonth(recentSavings, override) {
        if (override !== undefined)
            return override;
        if (recentSavings.length === 0)
            return 0;
        const months = new Map();
        for (const tx of recentSavings) {
            const d = new Date(tx.date);
            const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
            months.set(key, (months.get(key) ?? 0) + Number(tx.amount));
        }
        const totals = Array.from(months.values());
        const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
        return avg;
    }
    // --- Business Forecast ---
    async computeBusinessForecast(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const horizon = Math.max(1, Math.min(options.horizonMonths, 36));
        const startMonth = getCurrentMonth();
        const projects = await this.prismaClient.project.findMany({
            where: { business_id: businessId },
            select: { id: true, status: true, start_date: true, due_date: true, budget_amount: true },
        });
        const recentOut = await this.prismaClient.transactions.findMany({
            where: { user_id: userId, business_id: businessId, direction: 'out' },
            select: { amount: true, date: true },
        });
        const recurringExpensesPerMonth = this.estimateMonthlyAverage(recentOut, 6);
        const pipelineWeightedRevenue = this.computePipelineWeightedRevenue(projects);
        const averageProjectMarginPct = 50; // simple heuristic placeholder
        const months = [];
        for (let i = 0; i < horizon; i++) {
            const bucket = addMonths(startMonth, i);
            const monthKey = formatMonth(bucket);
            const { revenue, costs } = this.forecastFromProjects(projects, bucket, recurringExpensesPerMonth);
            months.push({
                month: monthKey,
                forecastedRevenue: revenue,
                forecastedCosts: costs,
                forecastedMargin: revenue - costs,
            });
        }
        return {
            months,
            assumptions: {
                recurringExpensesPerMonth,
                averageProjectMarginPct,
                pipelineWeightedRevenue,
            },
        };
    }
    estimateMonthlyAverage(transactions, monthsBack) {
        const cutoff = new Date();
        cutoff.setUTCMonth(cutoff.getUTCMonth() - monthsBack);
        const recent = transactions.filter((tx) => tx.date >= cutoff);
        if (recent.length === 0)
            return 0;
        const buckets = new Map();
        for (const tx of recent) {
            const d = new Date(tx.date);
            const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
            buckets.set(key, (buckets.get(key) ?? 0) + Number(tx.amount));
        }
        const totals = Array.from(buckets.values());
        return totals.reduce((a, b) => a + b, 0) / totals.length;
    }
    computePipelineWeightedRevenue(projects) {
        const weights = {
            prospecting: 0.2,
            quote_sent: 0.4,
            planned: 0.6,
            in_progress: 0.8,
            completed: 1,
        };
        return projects.reduce((sum, p) => {
            const weight = weights[p.status] ?? 0.3;
            const budget = p.budget_amount ? Number(p.budget_amount) : 0;
            return sum + budget * weight;
        }, 0);
    }
    forecastFromProjects(projects, bucket, recurringCosts) {
        const revenue = projects.reduce((sum, p) => {
            if (!p.budget_amount)
                return sum;
            const start = p.start_date ? new Date(p.start_date) : null;
            const end = p.due_date ? new Date(p.due_date) : null;
            if (!start || !end)
                return sum;
            const bucketDate = new Date(Date.UTC(bucket.year, bucket.month - 1, 1));
            if (bucketDate >= start && bucketDate <= end) {
                const months = Math.max(1, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth() + 1));
                return sum + Number(p.budget_amount) / months;
            }
            return sum;
        }, 0);
        const costs = recurringCosts;
        return { revenue, costs };
    }
}
exports.ForecastService = ForecastService;
exports.forecastService = new ForecastService(prisma_1.prisma);
