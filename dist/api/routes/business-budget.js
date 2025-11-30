"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessBudgetRoutes = registerBusinessBudgetRoutes;
const zod_1 = require("zod");
const business_budget_1 = require("@/api/schemas/business-budget");
const business_budgets_service_1 = require("@/modules/business/business-budgets.service");
const ids_1 = require("@/modules/shared/ids");
const decimalToNumber = (value) => typeof value === 'number' ? value : value.toNumber();
const parseDateOnly = (value) => new Date(`${value}T00:00:00.000Z`);
const toBusinessBudgetDto = (budget) => ({
    id: budget.id.toString(),
    userId: budget.user_id.toString(),
    businessId: budget.business_id.toString(),
    name: budget.name,
    currency: budget.currency ?? 'EUR',
    amount: decimalToNumber(budget.total_spending_limit ?? 0),
    periodStart: budget.start_date?.toISOString() ?? new Date().toISOString(),
    periodEnd: budget.end_date?.toISOString() ?? new Date().toISOString(),
    createdAt: budget.created_at.toISOString(),
    updatedAt: budget.updated_at.toISOString(),
});
async function registerBusinessBudgetRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/businesses/:businessId/budgets',
        schema: {
            tags: ['Business – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: business_budget_1.businessBudgetListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const budgets = await business_budgets_service_1.businessBudgetsService.listForBusiness(userId, businessId);
            return reply.send({ data: budgets.map(toBusinessBudgetDto) });
        },
    });
    server.route({
        method: 'POST',
        url: '/businesses/:businessId/budgets',
        schema: {
            tags: ['Business – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: business_budget_1.createBusinessBudgetBodySchema,
            response: {
                201: zod_1.z.object({ data: business_budget_1.businessBudgetSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const body = request.body;
            const budget = await business_budgets_service_1.businessBudgetsService.createForBusiness({
                userId,
                businessId,
                name: body.name,
                currency: body.currency ?? 'EUR',
                amount: body.amount,
                periodStart: parseDateOnly(body.periodStart),
                periodEnd: parseDateOnly(body.periodEnd),
            });
            return reply.code(201).send({ data: toBusinessBudgetDto(budget) });
        },
    });
    server.route({
        method: 'GET',
        url: '/businesses/:businessId/budgets/:budgetId',
        schema: {
            tags: ['Business – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), budgetId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: business_budget_1.businessBudgetSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const budgetId = BigInt(request.params.budgetId);
            const budget = await business_budgets_service_1.businessBudgetsService.getForBusiness(budgetId, userId, businessId);
            return reply.send({ data: toBusinessBudgetDto(budget) });
        },
    });
    server.route({
        method: 'PATCH',
        url: '/businesses/:businessId/budgets/:budgetId',
        schema: {
            tags: ['Business – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), budgetId: zod_1.z.string() }),
            body: business_budget_1.updateBusinessBudgetBodySchema,
            response: {
                200: zod_1.z.object({ data: business_budget_1.businessBudgetSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const budgetId = BigInt(request.params.budgetId);
            const body = request.body;
            const updated = await business_budgets_service_1.businessBudgetsService.updateForBusiness(budgetId, userId, businessId, {
                name: body.name,
                currency: body.currency,
                amount: body.amount,
                periodStart: body.periodStart ? parseDateOnly(body.periodStart) : undefined,
                periodEnd: body.periodEnd ? parseDateOnly(body.periodEnd) : undefined,
            });
            return reply.send({ data: toBusinessBudgetDto(updated) });
        },
    });
    server.route({
        method: 'DELETE',
        url: '/businesses/:businessId/budgets/:budgetId',
        schema: {
            tags: ['Business – Budgets'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string(), budgetId: zod_1.z.string() }),
            response: {
                204: zod_1.z.null(),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const budgetId = BigInt(request.params.budgetId);
            await business_budgets_service_1.businessBudgetsService.deleteForBusiness(budgetId, userId, businessId);
            return reply.code(204).send(null);
        },
    });
}
