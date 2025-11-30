"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicePaymentService = exports.InvoicePaymentService = exports.InvoicePaymentNotFoundError = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const invoice_service_1 = require("@/modules/invoice/invoice.service");
const transaction_service_1 = require("@/modules/transaction/transaction.service");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
const invoicePaymentSelect = {
    id: true,
    invoice_id: true,
    transaction_id: true,
    amount: true,
    paid_at: true,
    method: true,
    notes: true,
    created_at: true,
    updated_at: true,
};
class InvoicePaymentNotFoundError extends Error {
    constructor(message = 'Invoice payment not found') {
        super(message);
        this.name = 'InvoicePaymentNotFoundError';
    }
}
exports.InvoicePaymentNotFoundError = InvoicePaymentNotFoundError;
class InvoicePaymentService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async registerInvoicePayment(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
        const accountId = (0, ids_1.normalizeAccountId)(options.accountId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const account = await (0, assertions_1.assertAccountOwnedByUser)(this.prismaClient, accountId, userId);
        if (account.business_id !== businessId) {
            throw new Error('Account does not belong to this business');
        }
        const invoice = await this.prismaClient.invoices.findUnique({
            where: { id: options.invoiceId },
            select: {
                id: true,
                business_id: true,
                client_id: true,
                project_id: true,
                invoice_number: true,
                total_ttc: true,
                amount_paid_cached: true,
                currency: true,
            },
        });
        if (!invoice || invoice.business_id !== businessId) {
            throw new Error('Invoice not found for this business');
        }
        await (0, assertions_1.assertInvoiceOwnedByUser)(this.prismaClient, invoice.id, userId);
        const label = options.label ?? `Payment invoice ${invoice.invoice_number}`;
        const tx = await transaction_service_1.transactionService.createBusinessTransaction({
            userId,
            businessId,
            accountId,
            date: options.date,
            amount: options.amount,
            direction: 'in',
            label,
            type: 'income',
            invoiceId: invoice.id,
            notes: options.notes ?? null,
        });
        const updatedInvoice = await this.prismaClient.$transaction(async (trx) => {
            await trx.invoice_payments.create({
                data: {
                    invoice_id: invoice.id,
                    transaction_id: tx.id,
                    amount: new client_1.Prisma.Decimal(options.amount),
                    paid_at: options.date,
                    method: options.method ?? null,
                    notes: options.notes ?? null,
                },
            });
            const newPaid = new client_1.Prisma.Decimal(invoice.amount_paid_cached ?? 0).add(options.amount);
            const status = this.computeInvoiceStatus(new client_1.Prisma.Decimal(invoice.total_ttc ?? 0), newPaid);
            return trx.invoices.update({
                where: { id: invoice.id },
                data: { amount_paid_cached: newPaid, status },
            });
        });
        return { transaction: tx, invoice: updatedInvoice };
    }
    async listPaymentsForInvoice(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const invoiceId = BigInt(options.invoiceId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertInvoiceOwnedByUser)(this.prismaClient, invoiceId, userId);
        return this.prismaClient.invoice_payments.findMany({
            where: { invoice_id: invoiceId },
            select: invoicePaymentSelect,
            orderBy: { created_at: 'asc' },
        });
    }
    async deleteInvoicePayment(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const invoiceId = BigInt(options.invoiceId);
        const paymentId = BigInt(options.paymentId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const invoice = await this.prismaClient.invoices.findUnique({
            where: { id: invoiceId },
            select: {
                id: true,
                total_ttc: true,
                businesses: { select: { user_id: true } },
            },
        });
        if (!invoice) {
            throw new invoice_service_1.InvoiceNotFoundError();
        }
        if (invoice.businesses?.user_id !== userId) {
            throw new errors_1.InvoiceOwnershipError();
        }
        const payment = await this.prismaClient.invoice_payments.findUnique({
            where: { id: paymentId },
            select: { id: true, invoice_id: true, transaction_id: true },
        });
        if (!payment || payment.invoice_id !== invoiceId) {
            throw new InvoicePaymentNotFoundError();
        }
        let transactionOwnerCheck = null;
        if (payment.transaction_id) {
            transactionOwnerCheck = await this.prismaClient.transactions.findUnique({
                where: { id: payment.transaction_id },
                select: { id: true, user_id: true },
            });
            if (!transactionOwnerCheck) {
                throw new errors_1.TransactionNotFoundError();
            }
            if (transactionOwnerCheck.user_id !== userId) {
                throw new errors_1.TransactionOwnershipError();
            }
        }
        await this.prismaClient.$transaction(async (tx) => {
            if (payment.transaction_id) {
                await tx.transactions.delete({ where: { id: payment.transaction_id } });
            }
            await tx.invoice_payments.delete({ where: { id: payment.id } });
            const aggregate = await tx.invoice_payments.aggregate({
                where: { invoice_id: invoiceId },
                _sum: { amount: true },
            });
            const paid = new client_1.Prisma.Decimal(aggregate._sum.amount ?? 0);
            const status = this.computeInvoiceStatus(new client_1.Prisma.Decimal(invoice.total_ttc ?? 0), paid);
            await tx.invoices.update({
                where: { id: invoiceId },
                data: { amount_paid_cached: paid, status },
            });
        });
    }
    computeInvoiceStatus(total, paid) {
        if (paid.gte(total))
            return 'paid';
        if (paid.gt(0))
            return 'partially_paid';
        return 'issued';
    }
}
exports.InvoicePaymentService = InvoicePaymentService;
exports.invoicePaymentService = new InvoicePaymentService(prisma_1.prisma);
