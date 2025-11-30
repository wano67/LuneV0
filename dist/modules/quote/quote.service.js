"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotesService = exports.QuotesService = void 0;
// src/modules/quote/quote.service.ts
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
class QuotesService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    // CREATE --------------------------------------------------------------------
    async createQuote(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(input.businessId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        this.validateItemsOrThrow(input.items);
        const projectClient = await this.prismaClient.client.findUnique({
            where: { id: input.clientId },
            select: {
                id: true,
                business_id: true,
                client_id: true,
                name: true,
                email: true,
                phone: true,
                vat_number: true,
                address: true,
                notes: true,
            },
        });
        if (!projectClient || projectClient.business_id !== businessId) {
            throw new Error('Client not found for this business');
        }
        let clientId = projectClient.client_id ?? null;
        if (clientId === null) {
            const existingClient = await this.prismaClient.clients.findFirst({
                where: { business_id: businessId, name: projectClient.name },
                select: { id: true },
            });
            if (existingClient) {
                clientId = existingClient.id;
            }
            else {
                const createdClient = await this.prismaClient.clients.create({
                    data: {
                        business_id: businessId,
                        name: projectClient.name,
                        email: projectClient.email,
                        phone: projectClient.phone,
                        vat_number: projectClient.vat_number,
                        billing_address: projectClient.address,
                        notes: projectClient.notes,
                    },
                    select: { id: true },
                });
                clientId = createdClient.id;
            }
        }
        // Valide les services référencés dans les lignes (doivent appartenir au business)
        const serviceIds = input.items
            .map((i) => i.serviceId)
            .filter((id) => id !== undefined && id !== null);
        let serviceIdSet = null;
        if (serviceIds.length > 0) {
            const services = await this.prismaClient.services.findMany({
                where: { id: { in: serviceIds }, business_id: businessId },
                select: { id: true },
            });
            serviceIdSet = new Set(services.map((s) => s.id));
        }
        let projectId = null;
        if (input.projectId !== undefined && input.projectId !== null) {
            projectId = (0, ids_1.normalizeProjectId)(input.projectId);
            const project = await this.prismaClient.project.findUnique({
                where: { id: projectId },
                select: { id: true, user_id: true, business_id: true },
            });
            if (!project || project.user_id !== userId || project.business_id !== businessId) {
                throw new Error('Project not found or not part of this business');
            }
        }
        const settings = await this.prismaClient.business_settings.findUnique({
            where: { business_id: businessId },
            select: { quote_prefix: true, quote_next_number: true },
        });
        const prefix = settings?.quote_prefix ?? 'Q-';
        const nextNumber = settings?.quote_next_number ?? 1;
        const quoteNumber = `${prefix}${nextNumber}`;
        const totals = this.computeTotals(input.items);
        const created = await this.prismaClient.$transaction(async (tx) => {
            const quote = await tx.quotes.create({
                data: {
                    business_id: businessId,
                    client_id: clientId,
                    project_id: projectId,
                    quote_number: quoteNumber,
                    issue_date: input.issueDate,
                    valid_until: input.expiryDate ?? null,
                    status: 'draft',
                    currency: input.currency,
                    subtotal_ht: totals.subtotal,
                    discount_total: totals.discount,
                    vat_total: totals.vat,
                    total_ht: totals.subtotal.minus(totals.discount),
                    total_ttc: totals.total,
                    notes: input.notes ?? null,
                },
            });
            await tx.quote_lines.createMany({
                data: input.items.map((item) => ({
                    quote_id: quote.id,
                    service_id: item.serviceId && serviceIdSet ? (serviceIdSet.has(item.serviceId) ? item.serviceId : null) : item.serviceId ?? null,
                    description: item.description,
                    quantity: new client_1.Prisma.Decimal(item.quantity),
                    unit: null,
                    unit_price: new client_1.Prisma.Decimal(item.unitPrice),
                    vat_rate: new client_1.Prisma.Decimal(item.vatRate ?? 0),
                    discount_pct: new client_1.Prisma.Decimal(0),
                })),
            });
            await tx.business_settings.update({
                where: { business_id: businessId },
                data: { quote_next_number: nextNumber + 1 },
            });
            return quote;
        });
        return created;
    }
    // UPDATE CONTENT ------------------------------------------------------------
    async updateQuote(quoteId, userIdInput, businessIdInput, updates) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const existing = await this.prismaClient.quotes.findUnique({
            where: { id: quoteId },
            select: { id: true, business_id: true, status: true },
        });
        if (!existing || existing.business_id !== businessId) {
            throw new Error('Quote not found for this business');
        }
        if (existing.status !== 'draft') {
            throw new Error('Only draft quotes can be edited');
        }
        const hasItemsUpdate = !!updates.items && updates.items.length > 0;
        if (hasItemsUpdate) {
            this.validateItemsOrThrow(updates.items);
        }
        const updated = await this.prismaClient.$transaction(async (tx) => {
            let totals;
            if (hasItemsUpdate) {
                totals = this.computeTotals(updates.items);
                await tx.quote_lines.deleteMany({
                    where: { quote_id: quoteId },
                });
                await tx.quote_lines.createMany({
                    data: updates.items.map((item) => ({
                        quote_id: quoteId,
                        service_id: item.serviceId ?? null,
                        description: item.description,
                        quantity: new client_1.Prisma.Decimal(item.quantity),
                        unit: null,
                        unit_price: new client_1.Prisma.Decimal(item.unitPrice),
                        vat_rate: new client_1.Prisma.Decimal(item.vatRate ?? 0),
                        discount_pct: new client_1.Prisma.Decimal(0),
                    })),
                });
            }
            const data = {
                notes: updates.notes === undefined ? undefined : updates.notes,
                issue_date: updates.issueDate ?? undefined,
                valid_until: updates.expiryDate === undefined ? undefined : updates.expiryDate,
                status: updates.status ?? undefined,
            };
            if (totals) {
                data.subtotal_ht = totals.subtotal;
                data.discount_total = totals.discount;
                data.vat_total = totals.vat;
                data.total_ht = totals.subtotal.minus(totals.discount);
                data.total_ttc = totals.total;
            }
            return tx.quotes.update({
                where: { id: quoteId },
                data,
            });
        });
        return updated;
    }
    // UPDATE STATUS -------------------------------------------------------------
    async updateQuoteStatus(quoteId, userIdInput, status) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const existing = await this.prismaClient.quotes.findUnique({
            where: { id: quoteId },
            select: { id: true, business_id: true },
        });
        if (!existing)
            throw new Error('Quote not found');
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, existing.business_id, userId);
        const updated = await this.prismaClient.quotes.update({
            where: { id: quoteId },
            data: { status },
        });
        return updated;
    }
    // CONVERT TO INVOICE --------------------------------------------------------
    async convertAcceptedQuoteToInvoice(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const quote = await this.prismaClient.quotes.findUnique({
            where: { id: options.quoteId },
            select: {
                id: true,
                business_id: true,
                client_id: true,
                project_id: true,
                status: true,
                total_ttc: true,
                currency: true,
            },
        });
        if (!quote || quote.business_id !== businessId) {
            throw new Error('Quote not found for this business');
        }
        if (quote.status !== 'accepted') {
            throw new Error('Quote must be accepted before conversion');
        }
        const settings = await this.prismaClient.business_settings.findUnique({
            where: { business_id: businessId },
            select: {
                invoice_prefix: true,
                invoice_next_number: true,
                default_payment_terms_days: true,
            },
        });
        const invoicePrefix = settings?.invoice_prefix ?? 'INV-';
        const nextInvoiceNumber = settings?.invoice_next_number ?? 1;
        const invoiceNumber = `${invoicePrefix}${nextInvoiceNumber}`;
        const existingInvoices = await this.prismaClient.invoices.findMany({
            where: { quote_id: quote.id, business_id: businessId },
            select: { total_ttc: true },
        });
        const alreadyBilled = existingInvoices.reduce((sum, inv) => sum.add(inv.total_ttc ?? new client_1.Prisma.Decimal(0)), new client_1.Prisma.Decimal(0));
        const total = new client_1.Prisma.Decimal(quote.total_ttc ?? 0);
        let amountForInvoice;
        if (options.type === 'deposit') {
            const pct = options.depositPercentage ?? 30;
            amountForInvoice = total.mul(pct).div(100);
        }
        else if (options.type === 'final') {
            amountForInvoice = total.minus(alreadyBilled);
        }
        else {
            amountForInvoice = total;
        }
        if (amountForInvoice.lte(0)) {
            throw new Error('Nothing left to invoice');
        }
        const invoice = await this.prismaClient.$transaction(async (tx) => {
            const created = await tx.invoices.create({
                data: {
                    business_id: businessId,
                    client_id: quote.client_id,
                    project_id: quote.project_id ?? null,
                    quote_id: quote.id,
                    invoice_number: invoiceNumber,
                    invoice_date: new Date(),
                    due_date: new Date(Date.now() +
                        (settings?.default_payment_terms_days ?? 30) * 24 * 60 * 60 * 1000),
                    status: 'issued',
                    currency: quote.currency ?? 'EUR',
                    payment_terms_days: settings?.default_payment_terms_days ?? 30,
                    subtotal_ht: amountForInvoice,
                    discount_total: new client_1.Prisma.Decimal(0),
                    vat_total: new client_1.Prisma.Decimal(0),
                    total_ht: amountForInvoice,
                    total_ttc: amountForInvoice,
                    amount_paid_cached: new client_1.Prisma.Decimal(0),
                    notes: null,
                },
            });
            await tx.business_settings.update({
                where: { business_id: businessId },
                data: { invoice_next_number: nextInvoiceNumber + 1 },
            });
            return created;
        });
        return invoice;
    }
    // READ / LIST ---------------------------------------------------------------
    async getQuoteById(userIdInput, businessIdInput, quoteId) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const quote = await this.prismaClient.quotes.findUnique({
            where: { id: quoteId },
            include: {
                quote_lines: true,
                clients: true,
                project: true,
            },
        });
        if (!quote || quote.business_id !== businessId) {
            throw new Error('Quote not found for this business');
        }
        return quote;
    }
    async listQuotesForBusiness(userIdInput, businessIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        return this.prismaClient.quotes.findMany({
            where: { business_id: businessId },
            orderBy: { created_at: 'desc' },
        });
    }
    // DUPLICATION ---------------------------------------------------------------
    async duplicateQuote(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const existing = await this.prismaClient.quotes.findUnique({
            where: { id: options.quoteId },
            include: { quote_lines: true },
        });
        if (!existing || existing.business_id !== businessId) {
            throw new Error('Quote not found for this business');
        }
        const items = existing.quote_lines.map((line) => ({
            serviceId: line.service_id ?? undefined,
            description: line.description,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unit_price),
            vatRate: Number(line.vat_rate ?? 0),
        }));
        return this.createQuote({
            userId,
            businessId,
            clientId: existing.client_id,
            projectId: existing.project_id ?? null,
            currency: existing.currency ?? 'EUR',
            items,
            issueDate: options.issueDate,
            expiryDate: options.expiryDate,
            notes: existing.notes,
        });
    }
    // DELETE --------------------------------------------------------------------
    async deleteQuote(quoteId, userIdInput, businessIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const existing = await this.prismaClient.quotes.findUnique({
            where: { id: quoteId },
            select: { id: true, business_id: true, status: true },
        });
        if (!existing || existing.business_id !== businessId) {
            throw new Error('Quote not found for this business');
        }
        if (existing.status !== 'draft') {
            throw new Error('Only draft quotes can be deleted');
        }
        const linkedInvoices = await this.prismaClient.invoices.count({
            where: { quote_id: quoteId },
        });
        if (linkedInvoices > 0) {
            throw new Error('Cannot delete quote linked to invoices');
        }
        await this.prismaClient.$transaction(async (tx) => {
            await tx.quote_lines.deleteMany({ where: { quote_id: quoteId } });
            await tx.quotes.delete({ where: { id: quoteId } });
        });
    }
    // INTERNAL UTILS ------------------------------------------------------------
    validateItemsOrThrow(items) {
        if (!items || items.length === 0) {
            throw new Error('At least one item is required');
        }
        for (const item of items) {
            if (!item.description || !item.description.trim()) {
                throw new Error('Item description is required');
            }
            if (item.quantity <= 0) {
                throw new Error('Item quantity must be greater than zero');
            }
            if (item.unitPrice < 0) {
                throw new Error('Item unit price cannot be negative');
            }
            if (item.vatRate !== undefined && item.vatRate < 0) {
                throw new Error('VAT rate cannot be negative');
            }
        }
    }
    computeTotals(items) {
        const subtotal = items.reduce((sum, item) => sum.add(new client_1.Prisma.Decimal(item.unitPrice).mul(item.quantity)), new client_1.Prisma.Decimal(0));
        const vat = items.reduce((sum, item) => {
            const rate = item.vatRate ?? 0;
            const line = new client_1.Prisma.Decimal(item.unitPrice).mul(item.quantity);
            return sum.add(line.mul(rate).div(100));
        }, new client_1.Prisma.Decimal(0));
        const discount = new client_1.Prisma.Decimal(0);
        const total = subtotal.minus(discount).add(vat);
        return { subtotal, vat, discount, total };
    }
}
exports.QuotesService = QuotesService;
exports.quotesService = new QuotesService(prisma_1.prisma);
