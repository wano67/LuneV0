"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savingsService = exports.SavingsService = exports.InvalidSavingsGoalInputError = exports.SavingsGoalOwnershipError = exports.SavingsGoalNotFoundError = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const errors_1 = require("@/modules/shared/errors");
const assertions_1 = require("@/modules/shared/assertions");
const savingsGoalSelect = {
    id: true,
    user_id: true,
    name: true,
    target_amount: true,
    target_date: true,
    priority: true,
    linked_account_id: true,
    status: true,
    current_amount_cached: true,
    color: true,
    emoji: true,
    completed_at: true,
    created_at: true,
    updated_at: true,
};
class SavingsGoalNotFoundError extends Error {
    constructor(message = 'Savings goal not found') {
        super(message);
        this.name = 'SavingsGoalNotFoundError';
    }
}
exports.SavingsGoalNotFoundError = SavingsGoalNotFoundError;
class SavingsGoalOwnershipError extends Error {
    constructor(message = 'User does not own this savings goal') {
        super(message);
        this.name = 'SavingsGoalOwnershipError';
    }
}
exports.SavingsGoalOwnershipError = SavingsGoalOwnershipError;
class InvalidSavingsGoalInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidSavingsGoalInputError';
    }
}
exports.InvalidSavingsGoalInputError = InvalidSavingsGoalInputError;
function normalizeGoalName(name) {
    return name.trim().replace(/\s+/g, ' ').slice(0, 255);
}
function normalizeNote(note) {
    if (note == null)
        return null;
    return note.trim().replace(/\s+/g, ' ');
}
function parseDateToDateOnly(input) {
    if (input == null)
        return null;
    const parsed = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(parsed.getTime())) {
        throw new InvalidSavingsGoalInputError('Invalid date');
    }
    return parsed;
}
function validateAmount(amount, label) {
    if (!Number.isFinite(amount) || amount <= 0 || amount >= 1e12) {
        throw new InvalidSavingsGoalInputError(`${label} must be > 0 and reasonable`);
    }
}
function validateCurrentNotExceedTarget(current, target) {
    if (current < 0) {
        throw new InvalidSavingsGoalInputError('Current amount must be >= 0');
    }
    if (current > target) {
        throw new InvalidSavingsGoalInputError('Current amount cannot exceed target amount');
    }
}
function validatePriority(priority) {
    if (priority == null)
        return;
    const allowed = ['low', 'normal', 'high'];
    if (!allowed.includes(priority)) {
        throw new InvalidSavingsGoalInputError('Invalid savings goal priority');
    }
}
class SavingsService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async createPersonalSavingsGoal(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const name = normalizeGoalName(input.name);
        validateAmount(input.targetAmount, 'Target amount');
        const current = input.initialAmount ?? 0;
        validateCurrentNotExceedTarget(current, input.targetAmount);
        validatePriority(input.priority ?? null);
        const targetDate = parseDateToDateOnly(input.targetDate ?? null);
        // startDate is only validated via parseDateToDateOnly; it’s not persisted
        if (input.startDate !== undefined) {
            parseDateToDateOnly(input.startDate ?? null);
        }
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        let linkedAccountId = null;
        if (input.linkedAccountId !== undefined && input.linkedAccountId !== null) {
            const account = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, (0, ids_1.normalizeAccountId)(input.linkedAccountId), userId);
            if (account.business_id !== null) {
                throw new errors_1.AccountOwnershipError('Linked account must be personal (no business)');
            }
            linkedAccountId = account.id;
        }
        const goal = await this.prismaClient.savings_goals.create({
            data: {
                user_id: userId,
                name,
                target_amount: input.targetAmount,
                current_amount_cached: current,
                target_date: targetDate,
                priority: input.priority ?? null,
                linked_account_id: linkedAccountId,
                status: 'active',
                color: input.color ?? null,
                emoji: input.emoji ?? null,
                completed_at: null,
                // notes/start_date not in schema; ignored
            },
            select: savingsGoalSelect,
        });
        return goal;
    }
    async createBusinessSavingsGoal(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(input.businessId);
        const name = normalizeGoalName(input.name);
        validateAmount(input.targetAmount, 'Target amount');
        const current = input.initialAmount ?? 0;
        validateCurrentNotExceedTarget(current, input.targetAmount);
        validatePriority(input.priority ?? null);
        const targetDate = parseDateToDateOnly(input.targetDate ?? null);
        if (input.startDate !== undefined) {
            parseDateToDateOnly(input.startDate ?? null);
        }
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        let linkedAccountId = null;
        if (input.linkedAccountId !== undefined && input.linkedAccountId !== null) {
            const account = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, (0, ids_1.normalizeAccountId)(input.linkedAccountId), userId);
            if (account.business_id !== businessId) {
                throw new errors_1.AccountOwnershipError('Linked account must belong to the provided business');
            }
            linkedAccountId = account.id;
        }
        const goal = await this.prismaClient.savings_goals.create({
            data: {
                user_id: userId,
                name,
                target_amount: input.targetAmount,
                current_amount_cached: current,
                target_date: targetDate,
                priority: input.priority ?? null,
                linked_account_id: linkedAccountId,
                status: 'active',
                color: input.color ?? null,
                emoji: input.emoji ?? null,
                completed_at: null,
            },
            select: savingsGoalSelect,
        });
        return goal;
    }
    async getSavingsGoalForUser(goalIdInput, userIdInput) {
        const goalId = (0, ids_1.normalizeSavingsGoalId)(goalIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const goal = await this.prismaClient.savings_goals.findUnique({
            where: { id: goalId },
            select: savingsGoalSelect,
        });
        if (!goal) {
            throw new SavingsGoalNotFoundError();
        }
        if (goal.user_id !== userId) {
            throw new SavingsGoalOwnershipError();
        }
        return goal;
    }
    async listSavingsGoalsForUser(userIdInput, filters) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const where = {
            user_id: userId,
        };
        if (filters?.businessId !== undefined) {
            if (filters.businessId === null) {
                // Personal scope: no linked account OR linked to a personal account
                where.OR = [{ linked_account_id: null }, { accounts: { business_id: null } }];
            }
            else {
                const bizId = (0, ids_1.normalizeBusinessId)(filters.businessId);
                where.accounts = { business_id: bizId };
            }
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 1000) : 100;
        const offset = filters?.offset ?? 0;
        const goals = await this.prismaClient.savings_goals.findMany({
            where,
            select: savingsGoalSelect,
            orderBy: [{ target_date: 'asc' }, { created_at: 'asc' }],
            take: limit,
            skip: offset,
        });
        return goals;
    }
    async updateSavingsGoal(goalIdInput, userIdInput, input) {
        const goalId = (0, ids_1.normalizeSavingsGoalId)(goalIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await this.prismaClient.savings_goals.findUnique({
            where: { id: goalId },
            select: savingsGoalSelect,
        });
        if (!existing) {
            throw new SavingsGoalNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new SavingsGoalOwnershipError();
        }
        const targetAmount = input.targetAmount ?? Number(existing.target_amount);
        const currentAmount = input.currentAmount !== undefined ? input.currentAmount : Number(existing.current_amount_cached);
        validateAmount(targetAmount, 'Target amount');
        validateCurrentNotExceedTarget(currentAmount, targetAmount);
        if (input.priority !== undefined) {
            validatePriority(input.priority ?? null);
        }
        const targetDate = input.targetDate !== undefined ? parseDateToDateOnly(input.targetDate ?? null) : undefined;
        if (input.startDate !== undefined) {
            // no start_date column; just validate
            parseDateToDateOnly(input.startDate ?? null);
        }
        const data = {};
        if (input.name !== undefined)
            data.name = normalizeGoalName(input.name);
        if (input.targetAmount !== undefined)
            data.target_amount = input.targetAmount;
        if (input.currentAmount !== undefined)
            data.current_amount_cached = input.currentAmount;
        if (targetDate !== undefined)
            data.target_date = targetDate;
        if (input.priority !== undefined)
            data.priority = input.priority ?? null;
        if (input.status !== undefined)
            data.status = input.status;
        if (input.color !== undefined)
            data.color = input.color ?? null;
        if (input.emoji !== undefined)
            data.emoji = input.emoji ?? null;
        if (input.notes !== undefined) {
            // notes not in schema; ignore gracefully
        }
        if (input.linkedAccountId !== undefined) {
            if (input.linkedAccountId === null) {
                // dé-lier le compte
                data.linked_account_id = null;
            }
            else {
                const account = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, (0, ids_1.normalizeAccountId)(input.linkedAccountId), userId);
                data.linked_account_id = account.id;
            }
        }
        if (Object.keys(data).length === 0) {
            return existing;
        }
        try {
            const updated = await this.prismaClient.savings_goals.update({
                where: { id: goalId },
                data,
                select: savingsGoalSelect,
            });
            return updated;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new SavingsGoalNotFoundError();
            }
            throw err;
        }
    }
    async archiveSavingsGoal(goalIdInput, userIdInput) {
        return this.updateSavingsGoal(goalIdInput, userIdInput, { status: 'cancelled' });
    }
    async reactivateSavingsGoal(goalIdInput, userIdInput) {
        return this.updateSavingsGoal(goalIdInput, userIdInput, { status: 'active' });
    }
    async completeSavingsGoal(goalIdInput, userIdInput) {
        return this.updateSavingsGoal(goalIdInput, userIdInput, { status: 'completed' });
    }
    async pauseSavingsGoal(goalIdInput, userIdInput) {
        return this.updateSavingsGoal(goalIdInput, userIdInput, { status: 'paused' });
    }
    async deleteSavingsGoalForUser(goalIdInput, userIdInput) {
        const goalId = (0, ids_1.normalizeSavingsGoalId)(goalIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await this.prismaClient.savings_goals.findUnique({
            where: { id: goalId },
            select: { id: true, user_id: true },
        });
        if (!existing) {
            throw new SavingsGoalNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new SavingsGoalOwnershipError();
        }
        try {
            await this.prismaClient.savings_goals.delete({
                where: { id: goalId },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new SavingsGoalNotFoundError();
            }
            throw err;
        }
    }
    async computeSavingsOverviewForUser(userIdInput, filters) {
        const goals = await this.listSavingsGoalsForUser(userIdInput, filters);
        const goalsWithProgress = goals.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount_cached);
            const progressPct = target > 0 ? (current / target) * 100 : 0;
            const remainingAmount = Math.max(target - current, 0);
            const isCompleted = g.status === 'completed' || current >= target;
            return {
                ...g,
                progressPct,
                remainingAmount,
                isCompleted,
            };
        });
        const totalTarget = goalsWithProgress.reduce((sum, g) => sum + Number(g.target_amount), 0);
        const totalCurrent = goalsWithProgress.reduce((sum, g) => sum + Number(g.current_amount_cached), 0);
        const overallProgressPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
        return {
            goals: goalsWithProgress,
            totalTarget,
            totalCurrent,
            overallProgressPct,
        };
    }
    async computePersonalSavingsOverview(userIdInput) {
        const overview = await this.computeSavingsOverviewForUser(userIdInput, { businessId: null });
        return {
            goals: overview.goals,
            totalTarget: overview.totalTarget,
            totalCurrent: overview.totalCurrent,
            overallProgressPct: overview.overallProgressPct,
        };
    }
}
exports.SavingsService = SavingsService;
exports.savingsService = new SavingsService(prisma_1.prisma);
