"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = exports.TransactionService = exports.InvalidTransactionInputError = exports.TransactionOwnershipError = exports.TransactionNotFoundError = void 0;
// FILE: src/modules/transaction/transaction.service.ts
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const errors_1 = require("@/modules/shared/errors");
const assertions_1 = require("@/modules/shared/assertions");
class TransactionNotFoundError extends Error {
    constructor(message = 'Transaction not found') {
        super(message);
        this.name = 'TransactionNotFoundError';
    }
}
exports.TransactionNotFoundError = TransactionNotFoundError;
class TransactionOwnershipError extends Error {
    constructor(message = 'User does not own this transaction') {
        super(message);
        this.name = 'TransactionOwnershipError';
    }
}
exports.TransactionOwnershipError = TransactionOwnershipError;
class InvalidTransactionInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTransactionInputError';
    }
}
exports.InvalidTransactionInputError = InvalidTransactionInputError;
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
    raw_label: true,
    category_id: true,
    project_id: true,
    contact_id: true,
    income_source_id: true,
    invoice_id: true,
    supplier_id: true,
    notes: true,
    tags: true,
    is_recurring: true,
    recurring_series_id: true,
    created_at: true,
    updated_at: true,
};
function normalizeLabel(label) {
    return label.trim().replace(/\s+/g, ' ').slice(0, 255);
}
function normalizeRawLabel(rawLabel) {
    if (rawLabel == null)
        return null;
    return rawLabel.trim().replace(/\s+/g, ' ').slice(0, 255);
}
function validateAmount(amount) {
    if (!Number.isFinite(amount) || amount <= 0 || amount >= 1e12) {
        throw new InvalidTransactionInputError('Amount must be > 0 and reasonable');
    }
}
function validateDirection(direction) {
    if (direction !== 'in' && direction !== 'out') {
        throw new InvalidTransactionInputError('Direction must be "in" or "out"');
    }
}
function validateType(type) {
    if (type === undefined)
        return;
    const trimmed = type.trim();
    if (trimmed.length === 0 || trimmed.length > 30) {
        throw new InvalidTransactionInputError('Type must be 1-30 characters');
    }
}
function parseDateToDateOnly(date) {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(parsed.getTime())) {
        throw new InvalidTransactionInputError('Invalid date');
    }
    return parsed;
}
class TransactionService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    /**
     * Validate project ownership + personal/business coherence for a transaction.
     * - user must own the project
     * - if tx is personal (txBusinessId = null) → project.business_id must be null
     * - if tx is business (txBusinessId != null) → project.business_id is null or equals txBusinessId
     * Returns the normalized project id.
     */
    async validateProjectForTransaction(userId, projectId, txBusinessId) {
        const project = await this.prismaClient.project.findUnique({
            where: { id: projectId },
            select: { id: true, user_id: true, business_id: true },
        });
        if (!project || project.user_id !== userId) {
            throw new errors_1.ProjectOwnershipError();
        }
        if (txBusinessId === null) {
            // personal transaction: project must not belong to a business
            if (project.business_id !== null) {
                throw new errors_1.ProjectOwnershipError('Project belongs to a business, use createBusinessTransaction for this project');
            }
        }
        else {
            // business transaction: project may be generic (null) or belong to this business, but not another one
            if (project.business_id !== null && project.business_id !== txBusinessId) {
                throw new errors_1.ProjectOwnershipError('Project belongs to a different business');
            }
        }
        return project.id;
    }
    async createPersonalTransaction(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const accountId = (0, ids_1.normalizeAccountId)(input.accountId);
        const date = parseDateToDateOnly(input.date);
        const label = normalizeLabel(input.label);
        const rawLabel = normalizeRawLabel(input.rawLabel ?? null);
        validateAmount(input.amount);
        validateDirection(input.direction);
        validateType(input.type);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const account = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, accountId, userId);
        if (account.business_id !== null) {
            throw new errors_1.AccountOwnershipError('Personal transaction must use a personal account (no business_id)');
        }
        // --- related entities / ownership ---
        let categoryId = null;
        if (input.categoryId !== undefined && input.categoryId !== null) {
            const category = await (0, assertions_1.assertCategoryOwnedByUser)(this.prismaClient, input.categoryId, userId);
            categoryId = category.id;
        }
        let projectId = null;
        if (input.projectId !== undefined && input.projectId !== null) {
            const normalizedProjectId = (0, ids_1.normalizeProjectId)(input.projectId);
            projectId = await this.validateProjectForTransaction(userId, normalizedProjectId, null);
        }
        let contactId = null;
        if (input.contactId !== undefined && input.contactId !== null) {
            const contact = await (0, assertions_1.assertContactOwnedByUser)(this.prismaClient, input.contactId, userId);
            contactId = contact.id;
        }
        let incomeSourceId = null;
        if (input.incomeSourceId !== undefined && input.incomeSourceId !== null) {
            const incomeSource = await (0, assertions_1.assertIncomeSourceOwnedByUser)(this.prismaClient, input.incomeSourceId, userId);
            incomeSourceId = incomeSource.id;
        }
        let invoiceId = null;
        if (input.invoiceId !== undefined && input.invoiceId !== null) {
            const invoice = await (0, assertions_1.assertInvoiceOwnedByUser)(this.prismaClient, input.invoiceId, userId);
            invoiceId = invoice.id;
        }
        let supplierId = null;
        if (input.supplierId !== undefined && input.supplierId !== null) {
            const supplier = await (0, assertions_1.assertSupplierOwnedByUser)(this.prismaClient, input.supplierId, userId);
            supplierId = supplier.id;
        }
        let recurringSeriesId = null;
        if (input.recurringSeriesId !== undefined && input.recurringSeriesId !== null) {
            const series = await (0, assertions_1.assertRecurringSeriesOwnedByUser)(this.prismaClient, input.recurringSeriesId, userId);
            recurringSeriesId = series.id;
        }
        const tx = await this.prismaClient.transactions.create({
            data: {
                user_id: userId,
                business_id: null,
                account_id: accountId,
                date,
                amount: input.amount,
                direction: input.direction,
                type: input.type?.trim() || 'other',
                label,
                raw_label: rawLabel,
                category_id: categoryId,
                project_id: projectId,
                contact_id: contactId,
                income_source_id: incomeSourceId,
                invoice_id: invoiceId,
                supplier_id: supplierId,
                notes: input.notes ?? null,
                tags: input.tags ?? null,
                is_recurring: input.isRecurring ?? false,
                recurring_series_id: recurringSeriesId,
            },
            select: transactionSelect,
        });
        return tx;
    }
    async createBusinessTransaction(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(input.businessId);
        const accountId = (0, ids_1.normalizeAccountId)(input.accountId);
        const date = parseDateToDateOnly(input.date);
        const label = normalizeLabel(input.label);
        const rawLabel = normalizeRawLabel(input.rawLabel ?? null);
        validateAmount(input.amount);
        validateDirection(input.direction);
        validateType(input.type);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const account = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, accountId, userId);
        if (account.business_id !== businessId) {
            throw new errors_1.AccountOwnershipError('Account does not belong to this business');
        }
        // --- related entities / ownership ---
        let categoryId = null;
        if (input.categoryId !== undefined && input.categoryId !== null) {
            const category = await (0, assertions_1.assertCategoryOwnedByUser)(this.prismaClient, input.categoryId, userId);
            categoryId = category.id;
        }
        let projectId = null;
        if (input.projectId !== undefined && input.projectId !== null) {
            const normalizedProjectId = (0, ids_1.normalizeProjectId)(input.projectId);
            projectId = await this.validateProjectForTransaction(userId, normalizedProjectId, businessId);
        }
        let contactId = null;
        if (input.contactId !== undefined && input.contactId !== null) {
            const contact = await (0, assertions_1.assertContactOwnedByUser)(this.prismaClient, input.contactId, userId);
            contactId = contact.id;
        }
        let incomeSourceId = null;
        if (input.incomeSourceId !== undefined && input.incomeSourceId !== null) {
            const incomeSource = await (0, assertions_1.assertIncomeSourceOwnedByUser)(this.prismaClient, input.incomeSourceId, userId);
            incomeSourceId = incomeSource.id;
        }
        let invoiceId = null;
        if (input.invoiceId !== undefined && input.invoiceId !== null) {
            const invoice = await (0, assertions_1.assertInvoiceOwnedByUser)(this.prismaClient, input.invoiceId, userId);
            invoiceId = invoice.id;
        }
        let supplierId = null;
        if (input.supplierId !== undefined && input.supplierId !== null) {
            const supplier = await (0, assertions_1.assertSupplierOwnedByUser)(this.prismaClient, input.supplierId, userId);
            supplierId = supplier.id;
        }
        let recurringSeriesId = null;
        if (input.recurringSeriesId !== undefined && input.recurringSeriesId !== null) {
            const series = await (0, assertions_1.assertRecurringSeriesOwnedByUser)(this.prismaClient, input.recurringSeriesId, userId);
            recurringSeriesId = series.id;
        }
        const tx = await this.prismaClient.transactions.create({
            data: {
                user_id: userId,
                business_id: businessId,
                account_id: accountId,
                date,
                amount: input.amount,
                direction: input.direction,
                type: input.type?.trim() || 'other',
                label,
                raw_label: rawLabel,
                category_id: categoryId,
                project_id: projectId,
                contact_id: contactId,
                income_source_id: incomeSourceId,
                invoice_id: invoiceId,
                supplier_id: supplierId,
                notes: input.notes ?? null,
                tags: input.tags ?? null,
                is_recurring: input.isRecurring ?? false,
                recurring_series_id: recurringSeriesId,
            },
            select: transactionSelect,
        });
        return tx;
    }
    async createTransfer(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const fromAccountId = (0, ids_1.normalizeAccountId)(input.fromAccountId);
        const toAccountId = (0, ids_1.normalizeAccountId)(input.toAccountId);
        const date = parseDateToDateOnly(input.date);
        const label = normalizeLabel(input.label ?? 'Internal transfer');
        validateAmount(input.amount);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const fromAccount = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, fromAccountId, userId);
        const toAccount = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, toAccountId, userId);
        const [from, to] = await this.prismaClient.$transaction([
            this.prismaClient.transactions.create({
                data: {
                    user_id: userId,
                    business_id: fromAccount.business_id,
                    account_id: fromAccountId,
                    date,
                    amount: input.amount,
                    direction: 'out',
                    type: 'transfer',
                    label,
                    raw_label: null,
                    category_id: null,
                    project_id: null,
                    contact_id: null,
                    income_source_id: null,
                    invoice_id: null,
                    supplier_id: null,
                    notes: input.notes ?? null,
                    tags: input.tags ?? null,
                    is_recurring: false,
                    recurring_series_id: null,
                },
                select: transactionSelect,
            }),
            this.prismaClient.transactions.create({
                data: {
                    user_id: userId,
                    business_id: toAccount.business_id,
                    account_id: toAccountId,
                    date,
                    amount: input.amount,
                    direction: 'in',
                    type: 'transfer',
                    label,
                    raw_label: null,
                    category_id: null,
                    project_id: null,
                    contact_id: null,
                    income_source_id: null,
                    invoice_id: null,
                    supplier_id: null,
                    notes: input.notes ?? null,
                    tags: input.tags ?? null,
                    is_recurring: false,
                    recurring_series_id: null,
                },
                select: transactionSelect,
            }),
        ]);
        return { from, to };
    }
    async getTransactionForUser(transactionIdInput, userIdInput) {
        const transactionId = (0, ids_1.normalizeTransactionId)(transactionIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const tx = await this.prismaClient.transactions.findUnique({
            where: { id: transactionId },
            select: transactionSelect,
        });
        if (!tx) {
            throw new TransactionNotFoundError();
        }
        if (tx.user_id !== userId) {
            throw new TransactionOwnershipError();
        }
        return tx;
    }
    async listTransactionsForAccount(userIdInput, accountIdInput, filters) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const accountId = (0, ids_1.normalizeAccountId)(accountIdInput);
        await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, accountId, userId);
        const where = {
            user_id: userId,
            account_id: accountId,
        };
        this.applyFiltersToWhere(where, filters);
        const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 1000) : 100;
        const offset = filters?.offset ?? 0;
        const txs = await this.prismaClient.transactions.findMany({
            where,
            select: transactionSelect,
            orderBy: [{ date: 'asc' }, { created_at: 'asc' }],
            take: limit,
            skip: offset,
        });
        return txs;
    }
    async listTransactionsForUser(userIdInput, filters) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const where = {
            user_id: userId,
        };
        if (filters?.businessId !== undefined) {
            if (filters.businessId === null) {
                where.business_id = null;
            }
            else {
                where.business_id = (0, ids_1.normalizeBusinessId)(filters.businessId);
            }
        }
        if (filters?.accountIds && filters.accountIds.length > 0) {
            where.account_id = { in: filters.accountIds.map((id) => (0, ids_1.normalizeAccountId)(id)) };
        }
        this.applyFiltersToWhere(where, filters);
        const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 1000) : 100;
        const offset = filters?.offset ?? 0;
        const txs = await this.prismaClient.transactions.findMany({
            where,
            select: transactionSelect,
            orderBy: [{ date: 'asc' }, { created_at: 'asc' }],
            take: limit,
            skip: offset,
        });
        return txs;
    }
    async updateTransaction(transactionIdInput, userIdInput, input) {
        const transactionId = (0, ids_1.normalizeTransactionId)(transactionIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await this.prismaClient.transactions.findUnique({
            where: { id: transactionId },
            select: transactionSelect,
        });
        if (!existing) {
            throw new TransactionNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new TransactionOwnershipError();
        }
        const data = {};
        if (input.date !== undefined) {
            data.date = parseDateToDateOnly(input.date);
        }
        if (input.amount !== undefined) {
            validateAmount(input.amount);
            data.amount = input.amount;
        }
        if (input.direction !== undefined) {
            validateDirection(input.direction);
            data.direction = input.direction;
        }
        if (input.type !== undefined) {
            validateType(input.type);
            data.type = input.type.trim();
        }
        if (input.label !== undefined) {
            data.label = normalizeLabel(input.label);
        }
        if (input.rawLabel !== undefined) {
            data.raw_label = normalizeRawLabel(input.rawLabel);
        }
        // Relations with ownership checks & proper null / undefined semantics
        if (input.categoryId !== undefined) {
            if (input.categoryId === null) {
                data.category_id = null;
            }
            else {
                const category = await (0, assertions_1.assertCategoryOwnedByUser)(this.prismaClient, input.categoryId, userId);
                data.category_id = category.id;
            }
        }
        if (input.projectId !== undefined) {
            if (input.projectId === null) {
                data.project_id = null;
            }
            else {
                const normalizedProjectId = (0, ids_1.normalizeProjectId)(input.projectId);
                const projectId = await this.validateProjectForTransaction(userId, normalizedProjectId, existing.business_id);
                data.project_id = projectId;
            }
        }
        if (input.contactId !== undefined) {
            if (input.contactId === null) {
                data.contact_id = null;
            }
            else {
                const contact = await (0, assertions_1.assertContactOwnedByUser)(this.prismaClient, input.contactId, userId);
                data.contact_id = contact.id;
            }
        }
        if (input.incomeSourceId !== undefined) {
            if (input.incomeSourceId === null) {
                data.income_source_id = null;
            }
            else {
                const incomeSource = await (0, assertions_1.assertIncomeSourceOwnedByUser)(this.prismaClient, input.incomeSourceId, userId);
                data.income_source_id = incomeSource.id;
            }
        }
        if (input.invoiceId !== undefined) {
            if (input.invoiceId === null) {
                data.invoice_id = null;
            }
            else {
                const invoice = await (0, assertions_1.assertInvoiceOwnedByUser)(this.prismaClient, input.invoiceId, userId);
                data.invoice_id = invoice.id;
            }
        }
        if (input.supplierId !== undefined) {
            if (input.supplierId === null) {
                data.supplier_id = null;
            }
            else {
                const supplier = await (0, assertions_1.assertSupplierOwnedByUser)(this.prismaClient, input.supplierId, userId);
                data.supplier_id = supplier.id;
            }
        }
        if (input.notes !== undefined) {
            data.notes = input.notes ?? null;
        }
        if (input.tags !== undefined) {
            data.tags = input.tags ?? null;
        }
        if (input.isRecurring !== undefined) {
            data.is_recurring = input.isRecurring;
        }
        if (input.recurringSeriesId !== undefined) {
            if (input.recurringSeriesId === null) {
                data.recurring_series_id = null;
            }
            else {
                const series = await (0, assertions_1.assertRecurringSeriesOwnedByUser)(this.prismaClient, input.recurringSeriesId, userId);
                data.recurring_series_id = series.id;
            }
        }
        if (Object.keys(data).length === 0) {
            return this.getTransactionForUser(transactionId, userId);
        }
        try {
            const updated = await this.prismaClient.transactions.update({
                where: { id: transactionId },
                data,
                select: transactionSelect,
            });
            return updated;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new TransactionNotFoundError();
            }
            throw err;
        }
    }
    async deleteTransactionForUser(transactionIdInput, userIdInput) {
        const transactionId = (0, ids_1.normalizeTransactionId)(transactionIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await this.prismaClient.transactions.findUnique({
            where: { id: transactionId },
            select: { id: true, user_id: true },
        });
        if (!existing) {
            throw new TransactionNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new TransactionOwnershipError();
        }
        try {
            await this.prismaClient.transactions.delete({
                where: { id: transactionId },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new TransactionNotFoundError();
            }
            throw err;
        }
    }
    applyFiltersToWhere(where, filters) {
        if (!filters)
            return;
        if (filters.fromDate) {
            where.date = { ...where.date, gte: parseDateToDateOnly(filters.fromDate) };
        }
        if (filters.toDate) {
            where.date = { ...where.date, lte: parseDateToDateOnly(filters.toDate) };
        }
        if (filters.direction) {
            validateDirection(filters.direction);
            where.direction = filters.direction;
        }
        if (filters.minAmount !== undefined) {
            where.amount = { ...where.amount, gte: filters.minAmount };
        }
        if (filters.maxAmount !== undefined) {
            where.amount = { ...where.amount, lte: filters.maxAmount };
        }
        if (filters.categoryId !== undefined) {
            where.category_id = (0, ids_1.normalizeCategoryId)(filters.categoryId);
        }
        if (filters.projectId !== undefined) {
            where.project_id =
                filters.projectId === null ? null : (0, ids_1.normalizeProjectId)(filters.projectId);
        }
    }
}
exports.TransactionService = TransactionService;
exports.transactionService = new TransactionService(prisma_1.prisma);
