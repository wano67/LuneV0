"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalBudgetsService = exports.PersonalBudgetsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
const personalBudgetSelect = {
    id: true,
    user_id: true,
    business_id: true,
    name: true,
    currency: true,
    total_spending_limit: true,
    start_date: true,
    end_date: true,
    created_at: true,
    updated_at: true,
};
class PersonalBudgetsService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async listForUser(userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        return this.prismaClient.budgets.findMany({
            where: { user_id: userId, business_id: null },
            select: personalBudgetSelect,
            orderBy: { start_date: 'asc' },
        });
    }
    async createForUser(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const created = await this.prismaClient.budgets.create({
            data: {
                user_id: userId,
                business_id: null,
                name: input.name,
                currency: input.currency,
                total_spending_limit: new client_1.Prisma.Decimal(input.amount),
                start_date: input.periodStart,
                end_date: input.periodEnd,
                period_type: 'custom',
                scenario: 'base',
                status: 'active',
            },
            select: personalBudgetSelect,
        });
        return created;
    }
    async getForUser(budgetIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const budgetId = BigInt(budgetIdInput);
        const budget = await this.prismaClient.budgets.findUnique({
            where: { id: budgetId },
            select: personalBudgetSelect,
        });
        if (!budget) {
            throw new errors_1.BudgetNotFoundError();
        }
        if (budget.user_id !== userId || budget.business_id !== null) {
            throw new errors_1.BudgetOwnershipError();
        }
        return budget;
    }
    async updateForUser(budgetIdInput, userIdInput, updates) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const budgetId = BigInt(budgetIdInput);
        const existing = await this.prismaClient.budgets.findUnique({
            where: { id: budgetId },
            select: personalBudgetSelect,
        });
        if (!existing) {
            throw new errors_1.BudgetNotFoundError();
        }
        if (existing.user_id !== userId || existing.business_id !== null) {
            throw new errors_1.BudgetOwnershipError();
        }
        const data = {};
        if (updates.name !== undefined)
            data.name = updates.name;
        if (updates.currency !== undefined)
            data.currency = updates.currency;
        if (updates.amount !== undefined)
            data.total_spending_limit = new client_1.Prisma.Decimal(updates.amount);
        if (updates.periodStart !== undefined)
            data.start_date = updates.periodStart;
        if (updates.periodEnd !== undefined)
            data.end_date = updates.periodEnd;
        const updated = await this.prismaClient.budgets.update({
            where: { id: budgetId },
            data,
            select: personalBudgetSelect,
        });
        return updated;
    }
    async deleteForUser(budgetIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const budgetId = BigInt(budgetIdInput);
        const existing = await this.prismaClient.budgets.findUnique({
            where: { id: budgetId },
            select: personalBudgetSelect,
        });
        if (!existing) {
            throw new errors_1.BudgetNotFoundError();
        }
        if (existing.user_id !== userId || existing.business_id !== null) {
            throw new errors_1.BudgetOwnershipError();
        }
        await this.prismaClient.budgets.delete({ where: { id: budgetId } });
    }
}
exports.PersonalBudgetsService = PersonalBudgetsService;
exports.personalBudgetsService = new PersonalBudgetsService(prisma_1.prisma);
