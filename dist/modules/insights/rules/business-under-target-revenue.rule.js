"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessUnderTargetRevenueRule = businessUnderTargetRevenueRule;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
async function businessUnderTargetRevenueRule(options) {
    const client = options.prismaClient ?? prisma_1.prisma;
    const userId = (0, ids_1.normalizeUserId)(options.userId);
    const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
    await (0, assertions_1.assertUserExists)(client, userId);
    const business = await (0, assertions_1.assertBusinessOwnedByUser)(client, businessId, userId);
    const settings = await client.business_settings.findUnique({
        where: { business_id: businessId },
        select: { monthly_revenue_goal: true },
    });
    const goalDecimal = settings?.monthly_revenue_goal;
    if (!goalDecimal)
        return null;
    const goal = Number(goalDecimal);
    if (goal <= 0)
        return null;
    const monthStart = new Date(Date.UTC(options.year, options.month - 1, 1));
    const monthEnd = new Date(Date.UTC(options.year, options.month, 0, 23, 59, 59, 999));
    const revenueAgg = await client.transactions.aggregate({
        _sum: { amount: true },
        where: {
            user_id: userId,
            business_id: business.id,
            direction: 'in',
            date: { gte: monthStart, lte: monthEnd },
        },
    });
    const actual = Number(revenueAgg._sum.amount ?? 0);
    if (actual >= goal)
        return null;
    const gap = goal - actual;
    const gapPct = (gap / goal) * 100;
    const severity = gapPct > 20 ? 'warning' : 'info';
    return {
        id: 'business-under-target-revenue',
        userId,
        businessId,
        category: 'cashflow',
        severity,
        title: 'Chiffre d’affaires sous l’objectif',
        message: 'Votre chiffre d’affaires est en-dessous de l’objectif ce mois-ci.',
        data: {
            businessId,
            year: options.year,
            month: options.month,
            goal,
            actual,
            gap,
        },
    };
}
