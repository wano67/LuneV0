"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalTransactionsService = exports.PersonalTransactionsService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
class PersonalTransactionsService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    normalizeDate(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    async create(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const accountId = (0, ids_1.normalizeAccountId)(input.accountId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const account = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, accountId, userId);
        if (account.business_id !== null) {
            throw new errors_1.AccountOwnershipError('Personal transaction must use a personal account');
        }
        const tx = await this.prismaClient.transactions.create({
            data: {
                user_id: userId,
                business_id: null,
                account_id: accountId,
                date: this.normalizeDate(input.occurredAt),
                amount: input.amount,
                direction: input.direction,
                type: 'other',
                label: input.label,
                raw_label: null,
                category_id: null,
                project_id: null,
                contact_id: null,
                income_source_id: null,
                invoice_id: null,
                supplier_id: null,
                notes: input.notes ?? null,
                tags: null,
                is_recurring: false,
                recurring_series_id: null,
            },
            select: transactionSelect,
        });
        return tx;
    }
    async list(userIdInput, filters) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const where = {
            user_id: userId,
            business_id: null,
        };
        if (filters?.accountId) {
            where.account_id = (0, ids_1.normalizeAccountId)(filters.accountId);
        }
        if (filters?.dateFrom || filters?.dateTo) {
            where.date = {};
            if (filters?.dateFrom)
                where.date.gte = this.normalizeDate(filters.dateFrom);
            if (filters?.dateTo)
                where.date.lte = this.normalizeDate(filters.dateTo);
        }
        if (filters?.direction) {
            where.direction = filters.direction;
        }
        if (filters?.category) {
            where.notes = filters.category;
        }
        return this.prismaClient.transactions.findMany({
            where,
            select: transactionSelect,
            orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
        });
    }
    async getById(userIdInput, transactionIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const transactionId = (0, ids_1.normalizeTransactionId)(transactionIdInput);
        const tx = await this.prismaClient.transactions.findUnique({
            where: { id: transactionId },
            select: transactionSelect,
        });
        if (!tx)
            throw new errors_1.TransactionNotFoundError();
        if (tx.user_id !== userId || tx.business_id !== null)
            throw new errors_1.TransactionOwnershipError();
        return tx;
    }
    async update(userIdInput, transactionIdInput, updates) {
        await this.getById(userIdInput, transactionIdInput);
        const data = {};
        if (updates.direction !== undefined)
            data.direction = updates.direction;
        if (updates.amount !== undefined)
            data.amount = updates.amount;
        if (updates.occurredAt !== undefined)
            data.date = this.normalizeDate(updates.occurredAt);
        if (updates.label !== undefined)
            data.label = updates.label;
        if (updates.category !== undefined)
            data.notes = updates.category ?? null;
        if (updates.notes !== undefined)
            data.notes = updates.notes;
        const updated = await this.prismaClient.transactions.update({
            where: { id: (0, ids_1.normalizeTransactionId)(transactionIdInput) },
            data,
            select: transactionSelect,
        });
        return updated;
    }
    async delete(userIdInput, transactionIdInput) {
        await this.getById(userIdInput, transactionIdInput);
        await this.prismaClient.transactions.delete({ where: { id: (0, ids_1.normalizeTransactionId)(transactionIdInput) } });
    }
}
exports.PersonalTransactionsService = PersonalTransactionsService;
const transactionSelect = {
    id: true,
    user_id: true,
    business_id: true,
    account_id: true,
    date: true,
    amount: true,
    direction: true,
    type: true,
    label: true,
    notes: true,
    category_id: true,
    project_id: true,
    contact_id: true,
    income_source_id: true,
    invoice_id: true,
    supplier_id: true,
    tags: true,
    created_at: true,
    updated_at: true,
};
exports.personalTransactionsService = new PersonalTransactionsService(prisma_1.prisma);
