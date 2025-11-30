"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUserExists = assertUserExists;
exports.assertBusinessOwnedByUser = assertBusinessOwnedByUser;
exports.assertProjectOwnedByUser = assertProjectOwnedByUser;
exports.assertAccountOwnedByUser = assertAccountOwnedByUser;
exports.assertCategoryOwnedByUser = assertCategoryOwnedByUser;
exports.assertContactOwnedByUser = assertContactOwnedByUser;
exports.assertIncomeSourceOwnedByUser = assertIncomeSourceOwnedByUser;
exports.assertSupplierOwnedByUser = assertSupplierOwnedByUser;
exports.assertInvoiceOwnedByUser = assertInvoiceOwnedByUser;
exports.assertRecurringSeriesOwnedByUser = assertRecurringSeriesOwnedByUser;
const ids_1 = require("./ids");
const errors_1 = require("./errors");
const toBigInt = (value) => (typeof value === 'bigint' ? value : BigInt(value));
async function assertUserExists(prismaClient, userIdInput) {
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const user = await prismaClient.users.findUnique({
        where: { id: userId },
        select: { id: true },
    });
    if (!user)
        throw new errors_1.UserNotFoundError();
    return user;
}
async function assertBusinessOwnedByUser(prismaClient, businessIdInput, userIdInput) {
    const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const business = await prismaClient.businesses.findUnique({
        where: { id: businessId },
        select: { id: true, user_id: true, currency: true },
    });
    if (!business)
        throw new errors_1.BusinessNotFoundError();
    if (business.user_id !== userId)
        throw new errors_1.BusinessOwnershipError();
    return business;
}
async function assertProjectOwnedByUser(prismaClient, projectIdInput, userIdInput) {
    const projectId = (0, ids_1.normalizeProjectId)(projectIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const project = await prismaClient.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            user_id: true,
            business_id: true,
            name: true,
            status: true,
            start_date: true,
            due_date: true,
            completed_at: true,
            progress_auto_mode: true,
            budget_amount: true,
            progress_manual_pct: true,
        },
    });
    if (!project)
        throw new errors_1.ProjectNotFoundError();
    if (project.user_id !== userId)
        throw new errors_1.ProjectOwnershipError();
    return project;
}
async function assertAccountOwnedByUser(prismaClient, accountIdInput, userIdInput) {
    const accountId = (0, ids_1.normalizeAccountId)(accountIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const account = await prismaClient.accounts.findUnique({
        where: { id: accountId },
        select: { id: true, user_id: true, business_id: true, currency: true },
    });
    if (!account)
        throw new errors_1.AccountNotFoundError();
    if (account.user_id !== userId)
        throw new errors_1.AccountOwnershipError();
    return account;
}
async function assertCategoryOwnedByUser(prismaClient, categoryIdInput, userIdInput) {
    const categoryId = (0, ids_1.normalizeCategoryId)(categoryIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const category = await prismaClient.categories.findUnique({
        where: { id: categoryId },
        select: { id: true, user_id: true },
    });
    if (!category || category.user_id !== userId)
        throw new errors_1.CategoryOwnershipError();
    return category;
}
async function assertContactOwnedByUser(prismaClient, contactIdInput, userIdInput) {
    const contactId = toBigInt(contactIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const contact = await prismaClient.contacts.findUnique({
        where: { id: contactId },
        select: { id: true, user_id: true },
    });
    if (!contact || contact.user_id !== userId)
        throw new errors_1.ContactOwnershipError();
    return contact;
}
async function assertIncomeSourceOwnedByUser(prismaClient, incomeSourceIdInput, userIdInput) {
    const incomeSourceId = toBigInt(incomeSourceIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const incomeSource = await prismaClient.income_sources.findUnique({
        where: { id: incomeSourceId },
        select: { id: true, user_id: true },
    });
    if (!incomeSource || incomeSource.user_id !== userId)
        throw new errors_1.IncomeSourceOwnershipError();
    return incomeSource;
}
async function assertSupplierOwnedByUser(prismaClient, supplierIdInput, userIdInput) {
    const supplierId = toBigInt(supplierIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const supplier = await prismaClient.suppliers.findUnique({
        where: { id: supplierId },
        select: { id: true, businesses: { select: { user_id: true } } },
    });
    if (!supplier || supplier.businesses?.user_id !== userId)
        throw new errors_1.SupplierOwnershipError();
    return supplier;
}
async function assertInvoiceOwnedByUser(prismaClient, invoiceIdInput, userIdInput) {
    const invoiceId = toBigInt(invoiceIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const invoice = await prismaClient.invoices.findUnique({
        where: { id: invoiceId },
        select: { id: true, businesses: { select: { user_id: true } } },
    });
    if (!invoice || invoice.businesses?.user_id !== userId)
        throw new errors_1.InvoiceOwnershipError();
    return invoice;
}
async function assertRecurringSeriesOwnedByUser(prismaClient, seriesIdInput, userIdInput) {
    const seriesId = toBigInt(seriesIdInput);
    const userId = (0, ids_1.normalizeUserId)(userIdInput);
    const series = await prismaClient.recurring_series.findUnique({
        where: { id: seriesId },
        select: { id: true, user_id: true },
    });
    if (!series || series.user_id !== userId)
        throw new errors_1.RecurringSeriesOwnershipError();
    return series;
}
