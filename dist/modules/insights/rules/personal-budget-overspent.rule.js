"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalBudgetOverspentRule = personalBudgetOverspentRule;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
async function personalBudgetOverspentRule(options) {
    const client = options.prismaClient ?? prisma_1.prisma;
    const userId = (0, ids_1.normalizeUserId)(options.userId);
    await (0, assertions_1.assertUserExists)(client, userId);
    const budget = await client.budgets.findFirst({
        where: {
            user_id: userId,
            period_type: 'monthly',
            year: options.year,
            month: options.month,
            status: 'active',
        },
        select: {
            id: true,
            total_spending_limit: true,
        },
    });
    if (!budget || budget.total_spending_limit == null)
        return null;
    const monthStart = new Date(Date.UTC(options.year, options.month - 1, 1));
    const monthEnd = new Date(Date.UTC(options.year, options.month, 0, 23, 59, 59, 999));
    const spending = await client.transactions.aggregate({
        _sum: { amount: true },
        where: {
            user_id: userId,
            business_id: null,
            direction: 'out',
            date: { gte: monthStart, lte: monthEnd },
        },
    });
    const actual = Number(spending._sum.amount ?? 0);
    const budgetLimit = Number(budget.total_spending_limit ?? 0);
    if (budgetLimit <= 0)
        return null;
    if (actual <= budgetLimit)
        return null;
    const overspendPct = ((actual - budgetLimit) / budgetLimit) * 100;
    const severity = overspendPct > 20 ? 'critical' : 'warning';
    return {
        id: 'personal-budget-overspent',
        userId,
        businessId: null,
        category: 'budget',
        severity,
        title: 'Budget mensuel dépassé',
        message: 'Vos dépenses ont dépassé votre budget ce mois-ci.',
        data: {
            year: options.year,
            month: options.month,
            budget: budgetLimit,
            actual,
            overspendPct,
        },
    };
}
