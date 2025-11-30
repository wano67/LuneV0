"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = exports.AccountService = exports.InvalidAccountInputError = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const errors_1 = require("@/modules/shared/errors");
const assertions_1 = require("@/modules/shared/assertions");
class InvalidAccountInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidAccountInputError';
    }
}
exports.InvalidAccountInputError = InvalidAccountInputError;
const accountSelect = {
    id: true,
    user_id: true,
    business_id: true,
    name: true,
    type: true,
    currency: true,
    provider: true,
    is_active: true,
    include_in_budget: true,
    include_in_net_worth: true,
    connection_type: true,
    created_at: true,
    updated_at: true,
};
function normalizeAccountName(name) {
    return name.trim().replace(/\s+/g, ' ');
}
function validateAccountType(type) {
    const allowed = ['current', 'savings', 'investment', 'cash', 'other'];
    if (!allowed.includes(type)) {
        throw new InvalidAccountInputError('Invalid account type');
    }
}
function validateConnectionType(connectionType) {
    if (connectionType == null)
        return;
    const allowed = ['manual', 'aggregator', 'api'];
    if (!allowed.includes(connectionType)) {
        throw new InvalidAccountInputError('Invalid connection type');
    }
}
function validateCurrency(currency) {
    const trimmed = currency.trim();
    if (!trimmed || trimmed.length > 10) {
        throw new InvalidAccountInputError('Invalid currency');
    }
}
class AccountService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    /**
     * Return account with signed balance (in minus out) for the given user.
     */
    async getAccountWithBalanceForUser(accountIdInput, userIdInput) {
        const accountId = (0, ids_1.normalizeAccountId)(accountIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const account = await this.prismaClient.accounts.findUnique({
            where: { id: accountId },
            select: accountSelect,
        });
        if (!account)
            throw new errors_1.AccountNotFoundError();
        if (account.user_id !== userId)
            throw new errors_1.AccountOwnershipError();
        const txSums = await this.prismaClient.transactions.groupBy({
            by: ['account_id', 'direction'],
            where: { account_id: accountId },
            _sum: { amount: true },
        });
        const balance = txSums.reduce((sum, row) => {
            const amt = Number(row._sum.amount ?? 0);
            return sum + (row.direction === 'in' ? amt : -amt);
        }, 0);
        return { account, balance };
    }
    /**
     * List personal accounts (business_id null) with balances for the given user.
     */
    async listPersonalAccountsWithBalanceForUser(userIdInput, filters) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const accounts = await this.prismaClient.accounts.findMany({
            where: {
                user_id: userId,
                business_id: null,
                ...(filters?.includeInactive ? {} : { is_active: true }),
            },
            select: accountSelect,
            orderBy: { created_at: 'asc' },
        });
        if (accounts.length === 0)
            return [];
        const accountIds = accounts.map((a) => a.id);
        const txSums = await this.prismaClient.transactions.groupBy({
            by: ['account_id', 'direction'],
            where: { account_id: { in: accountIds } },
            _sum: { amount: true },
        });
        const balanceMap = new Map();
        txSums.forEach((row) => {
            const amt = Number(row._sum.amount ?? 0);
            const delta = row.direction === 'in' ? amt : -amt;
            balanceMap.set(row.account_id, (balanceMap.get(row.account_id) ?? 0) + delta);
        });
        return accounts.map((account) => ({
            account,
            balance: balanceMap.get(account.id) ?? 0,
        }));
    }
    async createPersonalAccount(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const name = normalizeAccountName(input.name);
        validateAccountType(input.type);
        validateConnectionType(input.connectionType ?? 'manual');
        validateCurrency(input.currency);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const account = await this.prismaClient.accounts.create({
            data: {
                user_id: userId,
                business_id: null,
                name,
                type: input.type,
                currency: input.currency.trim(),
                provider: input.provider ?? null,
                is_active: true,
                include_in_budget: input.includeInBudget ?? true,
                include_in_net_worth: input.includeInNetWorth ?? true,
                connection_type: input.connectionType ?? 'manual',
            },
            select: accountSelect,
        });
        return account;
    }
    async createBusinessAccount(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(input.businessId);
        const name = normalizeAccountName(input.name);
        validateAccountType(input.type);
        validateConnectionType(input.connectionType ?? 'manual');
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const business = await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const currency = input.currency?.trim() && input.currency.trim().length > 0
            ? input.currency.trim()
            : business.currency ?? 'EUR';
        validateCurrency(currency);
        const account = await this.prismaClient.accounts.create({
            data: {
                user_id: userId,
                business_id: businessId,
                name,
                type: input.type,
                currency,
                provider: input.provider ?? null,
                is_active: true,
                include_in_budget: input.includeInBudget ?? true,
                include_in_net_worth: input.includeInNetWorth ?? true,
                connection_type: input.connectionType ?? 'manual',
            },
            select: accountSelect,
        });
        return account;
    }
    async getAccountForUser(accountIdInput, userIdInput) {
        const accountId = (0, ids_1.normalizeAccountId)(accountIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const account = await this.prismaClient.accounts.findUnique({
            where: { id: accountId },
            select: accountSelect,
        });
        if (!account) {
            throw new errors_1.AccountNotFoundError();
        }
        if (account.user_id !== userId) {
            throw new errors_1.AccountOwnershipError();
        }
        return account;
    }
    async listPersonalAccountsForUser(userIdInput, options) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const accounts = await this.prismaClient.accounts.findMany({
            where: {
                user_id: userId,
                business_id: null,
                ...(options?.includeInactive ? {} : { is_active: true }),
                ...(options?.includeExcludedFromBudget ? {} : { include_in_budget: true }),
                ...(options?.includeExcludedFromNetWorth ? {} : { include_in_net_worth: true }),
            },
            select: accountSelect,
            orderBy: { created_at: 'asc' },
        });
        return accounts;
    }
    async listBusinessAccountsForUser(userIdInput, businessIdInput, options) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const accounts = await this.prismaClient.accounts.findMany({
            where: {
                user_id: userId,
                business_id: businessId,
                ...(options?.includeInactive ? {} : { is_active: true }),
                ...(options?.includeExcludedFromBudget ? {} : { include_in_budget: true }),
                ...(options?.includeExcludedFromNetWorth ? {} : { include_in_net_worth: true }),
            },
            select: accountSelect,
            orderBy: { created_at: 'asc' },
        });
        return accounts;
    }
    async updateAccount(accountIdInput, userIdInput, input) {
        const accountId = (0, ids_1.normalizeAccountId)(accountIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const account = await this.prismaClient.accounts.findUnique({
            where: { id: accountId },
            select: accountSelect,
        });
        if (!account) {
            throw new errors_1.AccountNotFoundError();
        }
        if (account.user_id !== userId) {
            throw new errors_1.AccountOwnershipError();
        }
        const data = {};
        if (input.name !== undefined) {
            data.name = normalizeAccountName(input.name);
        }
        if (input.type !== undefined) {
            validateAccountType(input.type);
            data.type = input.type;
        }
        if (input.currency !== undefined) {
            validateCurrency(input.currency);
            data.currency = input.currency.trim();
        }
        if (input.provider !== undefined) {
            data.provider = input.provider;
        }
        if (input.isActive !== undefined) {
            data.is_active = input.isActive;
        }
        if (input.includeInBudget !== undefined) {
            data.include_in_budget = input.includeInBudget;
        }
        if (input.includeInNetWorth !== undefined) {
            data.include_in_net_worth = input.includeInNetWorth;
        }
        if (input.connectionType !== undefined) {
            validateConnectionType(input.connectionType);
            data.connection_type = input.connectionType;
        }
        if (Object.keys(data).length === 0) {
            return this.getAccountForUser(accountId, userId);
        }
        try {
            const updated = await this.prismaClient.accounts.update({
                where: { id: accountId },
                data,
                select: accountSelect,
            });
            return updated;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new errors_1.AccountNotFoundError();
            }
            throw err;
        }
    }
    async archiveAccount(accountIdInput, userIdInput) {
        return this.updateAccount(accountIdInput, userIdInput, { isActive: false });
    }
    async reactivateAccount(accountIdInput, userIdInput) {
        return this.updateAccount(accountIdInput, userIdInput, { isActive: true });
    }
    async setBudgetInclusion(accountIdInput, userIdInput, includeInBudget) {
        return this.updateAccount(accountIdInput, userIdInput, { includeInBudget });
    }
    async setNetWorthInclusion(accountIdInput, userIdInput, includeInNetWorth) {
        return this.updateAccount(accountIdInput, userIdInput, { includeInNetWorth });
    }
}
exports.AccountService = AccountService;
exports.accountService = new AccountService(prisma_1.prisma);
