"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessBudgetsService = exports.BusinessBudgetsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
const businessBudgetSelect = {
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
class BusinessBudgetsService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async listForBusiness(userIdInput, businessIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        return this.prismaClient.budgets.findMany({
            where: { user_id: userId, business_id: businessId },
            select: businessBudgetSelect,
            orderBy: { start_date: 'asc' },
        });
    }
    async createForBusiness(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(input.businessId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const created = await this.prismaClient.budgets.create({
            data: {
                user_id: userId,
                business_id: businessId,
                name: input.name,
                currency: input.currency,
                total_spending_limit: new client_1.Prisma.Decimal(input.amount),
                start_date: input.periodStart,
                end_date: input.periodEnd,
                period_type: 'custom',
                scenario: 'base',
                status: 'active',
            },
            select: businessBudgetSelect,
        });
        return created;
    }
    async getForBusiness(budgetIdInput, userIdInput, businessIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const budgetId = BigInt(budgetIdInput);
        const budget = await this.prismaClient.budgets.findUnique({
            where: { id: budgetId },
            select: businessBudgetSelect,
        });
        if (!budget) {
            throw new errors_1.BudgetNotFoundError();
        }
        if (budget.user_id !== userId || budget.business_id !== businessId) {
            throw new errors_1.BudgetOwnershipError();
        }
        return budget;
    }
    async updateForBusiness(budgetIdInput, userIdInput, businessIdInput, updates) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const budgetId = BigInt(budgetIdInput);
        const existing = await this.prismaClient.budgets.findUnique({
            where: { id: budgetId },
            select: businessBudgetSelect,
        });
        if (!existing) {
            throw new errors_1.BudgetNotFoundError();
        }
        if (existing.user_id !== userId || existing.business_id !== businessId) {
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
            select: businessBudgetSelect,
        });
        return updated;
    }
    async deleteForBusiness(budgetIdInput, userIdInput, businessIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const budgetId = BigInt(budgetIdInput);
        const existing = await this.prismaClient.budgets.findUnique({
            where: { id: budgetId },
            select: businessBudgetSelect,
        });
        if (!existing) {
            throw new errors_1.BudgetNotFoundError();
        }
        if (existing.user_id !== userId || existing.business_id !== businessId) {
            throw new errors_1.BudgetOwnershipError();
        }
        await this.prismaClient.budgets.delete({ where: { id: budgetId } });
    }
}
exports.BusinessBudgetsService = BusinessBudgetsService;
exports.businessBudgetsService = new BusinessBudgetsService(prisma_1.prisma);
