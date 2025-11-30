"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessLowMarginProjectRule = businessLowMarginProjectRule;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
async function businessLowMarginProjectRule(options) {
    const client = options.prismaClient ?? prisma_1.prisma;
    const userId = (0, ids_1.normalizeUserId)(options.userId);
    const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
    await (0, assertions_1.assertUserExists)(client, userId);
    await (0, assertions_1.assertBusinessOwnedByUser)(client, businessId, userId);
    const projects = await client.project.findMany({
        where: { business_id: businessId },
        select: { id: true, name: true, budget_amount: true },
    });
    if (projects.length === 0)
        return null;
    const lowMargin = [];
    for (const project of projects) {
        const sums = await client.transactions.groupBy({
            by: ['direction'],
            where: { project_id: project.id, user_id: userId },
            _sum: { amount: true },
        });
        const revenue = sums
            .filter((s) => s.direction === 'in')
            .reduce((sum, s) => sum.add(s._sum.amount ?? 0), new client_1.Prisma.Decimal(0));
        const costs = sums
            .filter((s) => s.direction === 'out')
            .reduce((sum, s) => sum.add(s._sum.amount ?? 0), new client_1.Prisma.Decimal(0));
        if (revenue.eq(0))
            continue;
        const marginPct = revenue.minus(costs).div(revenue).mul(100).toNumber();
        if (marginPct < 20) {
            lowMargin.push({ projectId: project.id, name: project.name, marginPct });
        }
    }
    if (lowMargin.length === 0)
        return null;
    return {
        id: 'business-low-margin-project',
        userId,
        businessId,
        category: 'cashflow',
        severity: 'warning',
        title: 'Projets à faible marge',
        message: 'Certains projets présentent une marge faible.',
        data: {
            businessId,
            projects: lowMargin,
        },
    };
}
