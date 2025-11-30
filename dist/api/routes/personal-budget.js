"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalBudgetRoutes = registerPersonalBudgetRoutes;
const zod_1 = require("zod");
const personal_budget_1 = require("@/api/schemas/personal-budget");
const personal_budgets_service_1 = require("@/modules/personal/personal-budgets.service");
const ids_1 = require("@/modules/shared/ids");
const personal_transactions_service_1 = require("@/modules/personal/personal-transactions.service");
const decimalToNumber = (value) => typeof value === 'number' ? value : value.toNumber();
const parseDateOnly = (value) => new Date(`${value}T00:00:00.000Z`);
const toPersonalBudgetDto = (budget, spent) => {
    const amount = decimalToNumber(budget.total_spending_limit ?? 0);
    const spentValue = spent ?? 0;
    const remaining = amount - spentValue;
    const utilizationPct = amount > 0 ? Math.min(100, (spentValue / amount) * 100) : undefined;
    return {
        id: budget.id.toString(),
        userId: budget.user_id.toString(),
        name: budget.name,
        currency: budget.currency ?? 'EUR',
        amount,
        periodStart: budget.start_date?.toISOString() ?? new Date().toISOString(),
        periodEnd: budget.end_date?.toISOString() ?? new Date().toISOString(),
        spent: spentValue,
        remaining,
        utilizationPct,
        createdAt: budget.created_at.toISOString(),
        updatedAt: budget.updated_at.toISOString(),
    };
};
async function computeBudgetSpent(userId, budget) {
    if (!budget.start_date || !budget.end_date)
        return 0;
    const txs = await personal_transactions_service_1.personalTransactionsService.list(userId, {
        accountId: undefined,
        dateFrom: budget.start_date,
        dateTo: budget.end_date,
        direction: 'out',
    });
    return txs.reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
}
async function registerPersonalBudgetRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/personal/budgets',
        schema: {
            tags: ['Personal – Budgets'],
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.z.object({ data: personal_budget_1.personalBudgetListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const budgets = await personal_budgets_service_1.personalBudgetsService.listForUser(userId);
            const withSpent = await Promise.all(budgets.map(async (b) => {
                const spent = await computeBudgetSpent(userId, b);
                return toPersonalBudgetDto(b, spent);
            }));
            return reply.send({ data: withSpent });
        },
    });
    server.route({
        method: 'POST',
        url: '/personal/budgets',
        schema: {
            tags: ['Personal – Budgets'],
            security: [{ bearerAuth: [] }],
            body: personal_budget_1.createPersonalBudgetBodySchema,
            response: {
                201: zod_1.z.object({ data: personal_budget_1.personalBudgetSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const body = request.body;
            const budget = await personal_budgets_service_1.personalBudgetsService.createForUser({
                userId,
                name: body.name,
                currency: body.currency ?? 'EUR',
                amount: body.amount,
                periodStart: parseDateOnly(body.periodStart),
                periodEnd: parseDateOnly(body.periodEnd),
            });
            const spent = await computeBudgetSpent(userId, budget);
            return reply.code(201).send({ data: toPersonalBudgetDto(budget, spent) });
        },
    });
    server.route({
        method: 'GET',
        url: '/personal/budgets/:budgetId',
        schema: {
            tags: ['Personal – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ budgetId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: personal_budget_1.personalBudgetSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const budgetId = BigInt(request.params.budgetId);
            const budget = await personal_budgets_service_1.personalBudgetsService.getForUser(budgetId, userId);
            const spent = await computeBudgetSpent(userId, budget);
            return reply.send({ data: toPersonalBudgetDto(budget, spent) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/personal/budgets/:budgetId',
        schema: {
            tags: ['Personal – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ budgetId: zod_1.z.string() }),
            body: personal_budget_1.updatePersonalBudgetBodySchema,
            response: {
                200: zod_1.z.object({ data: personal_budget_1.personalBudgetSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const budgetId = BigInt(request.params.budgetId);
            const body = request.body;
            const updated = await personal_budgets_service_1.personalBudgetsService.updateForUser(budgetId, userId, {
                name: body.name,
                currency: body.currency,
                amount: body.amount,
                periodStart: body.periodStart ? parseDateOnly(body.periodStart) : undefined,
                periodEnd: body.periodEnd ? parseDateOnly(body.periodEnd) : undefined,
            });
            const spent = await computeBudgetSpent(userId, updated);
            return reply.send({ data: toPersonalBudgetDto(updated, spent) });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/personal/budgets/:budgetId',
        schema: {
            tags: ['Personal – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ budgetId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const budgetId = BigInt(request.params.budgetId);
            await personal_budgets_service_1.personalBudgetsService.deleteForUser(budgetId, userId);
            return reply.code(204).send(null);
        },
    });
}
