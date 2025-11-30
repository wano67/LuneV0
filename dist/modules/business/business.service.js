"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessService = exports.BusinessService = exports.InvalidBusinessSettingsError = exports.BusinessNameAlreadyExistsError = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const errors_1 = require("@/modules/shared/errors");
class BusinessNameAlreadyExistsError extends Error {
    constructor(message = 'Business name already exists for this user') {
        super(message);
        this.name = 'BusinessNameAlreadyExistsError';
    }
}
exports.BusinessNameAlreadyExistsError = BusinessNameAlreadyExistsError;
class InvalidBusinessSettingsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidBusinessSettingsError';
    }
}
exports.InvalidBusinessSettingsError = InvalidBusinessSettingsError;
function normalizeName(name) {
    return name.trim().replace(/\s+/g, ' ');
}
function validateSettingsInput(input) {
    if (input.invoiceNextNumber !== undefined) {
        if (input.invoiceNextNumber === null ||
            !Number.isInteger(input.invoiceNextNumber) ||
            input.invoiceNextNumber < 1) {
            throw new InvalidBusinessSettingsError('invoiceNextNumber must be an integer >= 1');
        }
    }
    if (input.quoteNextNumber !== undefined) {
        if (input.quoteNextNumber === null ||
            !Number.isInteger(input.quoteNextNumber) ||
            input.quoteNextNumber < 1) {
            throw new InvalidBusinessSettingsError('quoteNextNumber must be an integer >= 1');
        }
    }
    if (input.defaultVatRate !== undefined) {
        if (input.defaultVatRate !== null &&
            (!Number.isFinite(input.defaultVatRate) || input.defaultVatRate < 0 || input.defaultVatRate > 100)) {
            throw new InvalidBusinessSettingsError('defaultVatRate must be between 0 and 100');
        }
    }
    if (input.defaultPaymentTermsDays !== undefined) {
        if (input.defaultPaymentTermsDays === null ||
            !Number.isInteger(input.defaultPaymentTermsDays) ||
            input.defaultPaymentTermsDays < 0) {
            throw new InvalidBusinessSettingsError('defaultPaymentTermsDays must be an integer >= 0');
        }
    }
}
class BusinessService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async createBusinessWithDefaultSettings(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const name = normalizeName(input.name);
        validateSettingsInput({
            defaultVatRate: input.defaultVatRate,
            defaultPaymentTermsDays: input.defaultPaymentTermsDays,
        });
        try {
            const result = await this.prismaClient.$transaction(async (tx) => {
                const user = await tx.users.findUnique({
                    where: { id: userId },
                    select: { id: true },
                });
                if (!user) {
                    throw new errors_1.UserNotFoundError();
                }
                const userSettings = await tx.user_settings.findUnique({
                    where: { user_id: userId },
                    select: { main_currency: true },
                });
                const business = await tx.businesses.create({
                    data: {
                        user_id: userId,
                        name,
                        legal_form: input.legalForm ?? null,
                        registration_number: input.registrationNumber ?? null,
                        tax_id: input.taxId ?? null,
                        currency: input.currency ?? userSettings?.main_currency ?? 'EUR',
                        is_active: true,
                    },
                    select: {
                        id: true,
                        user_id: true,
                        name: true,
                        legal_form: true,
                        registration_number: true,
                        tax_id: true,
                        currency: true,
                        is_active: true,
                        created_at: true,
                        updated_at: true,
                    },
                });
                const settings = await tx.business_settings.create({
                    data: {
                        business_id: business.id,
                        invoice_prefix: input.invoicePrefix ?? 'INV-',
                        invoice_next_number: 1,
                        quote_prefix: input.quotePrefix ?? 'Q-',
                        quote_next_number: 1,
                        default_vat_rate: input.defaultVatRate ?? null,
                        default_payment_terms_days: input.defaultPaymentTermsDays ?? 30,
                    },
                    select: {
                        business_id: true,
                        invoice_prefix: true,
                        invoice_next_number: true,
                        quote_prefix: true,
                        quote_next_number: true,
                        default_vat_rate: true,
                        default_payment_terms_days: true,
                        created_at: true,
                        updated_at: true,
                    },
                });
                return { business, settings };
            });
            return result;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new BusinessNameAlreadyExistsError();
            }
            throw err;
        }
    }
    async getBusinessWithSettingsForUser(businessIdInput, userIdInput) {
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const business = await this.prismaClient.businesses.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                user_id: true,
                name: true,
                legal_form: true,
                registration_number: true,
                tax_id: true,
                currency: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!business) {
            throw new errors_1.BusinessNotFoundError();
        }
        if (business.user_id !== userId) {
            throw new errors_1.BusinessOwnershipError();
        }
        const settings = await this.ensureBusinessSettings(businessId);
        return { business, settings };
    }
    async listBusinessesForUser(userIdInput, options) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businesses = await this.prismaClient.businesses.findMany({
            where: {
                user_id: userId,
                ...(options?.includeInactive ? {} : { is_active: true }),
            },
            select: {
                id: true,
                user_id: true,
                name: true,
                legal_form: true,
                registration_number: true,
                tax_id: true,
                currency: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { created_at: 'asc' },
        });
        if (businesses.length === 0) {
            return [];
        }
        const businessIds = businesses.map((b) => b.id);
        const settingsList = await this.prismaClient.business_settings.findMany({
            where: { business_id: { in: businessIds } },
            select: {
                business_id: true,
                invoice_prefix: true,
                invoice_next_number: true,
                quote_prefix: true,
                quote_next_number: true,
                default_vat_rate: true,
                default_payment_terms_days: true,
                created_at: true,
                updated_at: true,
            },
        });
        const settingsMap = new Map();
        settingsList.forEach((s) => settingsMap.set(s.business_id, s));
        const withSettings = await Promise.all(businesses.map(async (business) => {
            const foundSettings = settingsMap.get(business.id) ?? (await this.ensureBusinessSettings(business.id));
            return { business, settings: foundSettings };
        }));
        return withSettings;
    }
    async updateBusinessProfile(businessIdInput, userIdInput, input) {
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await this.prismaClient.businesses.findUnique({
            where: { id: businessId },
            select: { user_id: true },
        });
        if (!existing) {
            throw new errors_1.BusinessNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new errors_1.BusinessOwnershipError();
        }
        const data = {};
        if (input.name !== undefined)
            data.name = normalizeName(input.name);
        if (input.legalForm !== undefined)
            data.legal_form = input.legalForm;
        if (input.registrationNumber !== undefined)
            data.registration_number = input.registrationNumber;
        if (input.taxId !== undefined)
            data.tax_id = input.taxId;
        if (input.currency !== undefined)
            data.currency = input.currency;
        if (input.isActive !== undefined)
            data.is_active = input.isActive;
        if (Object.keys(data).length === 0) {
            return this.getBusinessWithSettingsForUser(businessId, userId);
        }
        try {
            const business = await this.prismaClient.businesses.update({
                where: { id: businessId },
                data,
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    legal_form: true,
                    registration_number: true,
                    tax_id: true,
                    currency: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            const settings = await this.ensureBusinessSettings(businessId);
            return { business, settings };
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new BusinessNameAlreadyExistsError();
            }
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new errors_1.BusinessNotFoundError();
            }
            throw err;
        }
    }
    async updateBusinessSettings(businessIdInput, userIdInput, input) {
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        validateSettingsInput({
            invoiceNextNumber: input.invoiceNextNumber,
            quoteNextNumber: input.quoteNextNumber,
            defaultVatRate: input.defaultVatRate,
            defaultPaymentTermsDays: input.defaultPaymentTermsDays,
        });
        const business = await this.prismaClient.businesses.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                user_id: true,
                name: true,
                legal_form: true,
                registration_number: true,
                tax_id: true,
                currency: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!business) {
            throw new errors_1.BusinessNotFoundError();
        }
        if (business.user_id !== userId) {
            throw new errors_1.BusinessOwnershipError();
        }
        const existingSettings = await this.prismaClient.business_settings.findUnique({
            where: { business_id: businessId },
            select: {
                business_id: true,
                invoice_prefix: true,
                invoice_next_number: true,
                quote_prefix: true,
                quote_next_number: true,
                default_vat_rate: true,
                default_payment_terms_days: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!existingSettings) {
            const created = await this.prismaClient.business_settings.create({
                data: {
                    business_id: businessId,
                    invoice_prefix: input.invoicePrefix ?? 'INV-',
                    invoice_next_number: input.invoiceNextNumber ?? 1,
                    quote_prefix: input.quotePrefix ?? 'Q-',
                    quote_next_number: input.quoteNextNumber ?? 1,
                    default_vat_rate: input.defaultVatRate ?? null,
                    default_payment_terms_days: input.defaultPaymentTermsDays ?? 30,
                },
                select: {
                    business_id: true,
                    invoice_prefix: true,
                    invoice_next_number: true,
                    quote_prefix: true,
                    quote_next_number: true,
                    default_vat_rate: true,
                    default_payment_terms_days: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            return { business, settings: created };
        }
        const data = {};
        if (input.invoicePrefix !== undefined) {
            data.invoice_prefix = input.invoicePrefix;
        }
        if (input.invoiceNextNumber !== undefined && input.invoiceNextNumber !== null) {
            data.invoice_next_number = input.invoiceNextNumber;
        }
        if (input.quotePrefix !== undefined) {
            data.quote_prefix = input.quotePrefix;
        }
        if (input.quoteNextNumber !== undefined && input.quoteNextNumber !== null) {
            data.quote_next_number = input.quoteNextNumber;
        }
        if (input.defaultVatRate !== undefined) {
            data.default_vat_rate = input.defaultVatRate;
        }
        if (input.defaultPaymentTermsDays !== undefined && input.defaultPaymentTermsDays !== null) {
            data.default_payment_terms_days = input.defaultPaymentTermsDays;
        }
        const settings = await this.prismaClient.business_settings.update({
            where: { business_id: businessId },
            data,
            select: {
                business_id: true,
                invoice_prefix: true,
                invoice_next_number: true,
                quote_prefix: true,
                quote_next_number: true,
                default_vat_rate: true,
                default_payment_terms_days: true,
                created_at: true,
                updated_at: true,
            },
        });
        return { business, settings };
    }
    async archiveBusiness(businessIdInput, userIdInput) {
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await this.prismaClient.businesses.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                user_id: true,
                name: true,
                legal_form: true,
                registration_number: true,
                tax_id: true,
                currency: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!existing) {
            throw new errors_1.BusinessNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new errors_1.BusinessOwnershipError();
        }
        try {
            const business = await this.prismaClient.businesses.update({
                where: { id: businessId },
                data: { is_active: false },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    legal_form: true,
                    registration_number: true,
                    tax_id: true,
                    currency: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            const settings = await this.ensureBusinessSettings(businessId);
            return { business, settings };
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new errors_1.BusinessNotFoundError();
            }
            if (err instanceof errors_1.BusinessOwnershipError) {
                throw err;
            }
            throw err;
        }
    }
    async reactivateBusiness(businessIdInput, userIdInput) {
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await this.prismaClient.businesses.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                user_id: true,
                name: true,
                legal_form: true,
                registration_number: true,
                tax_id: true,
                currency: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!existing) {
            throw new errors_1.BusinessNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new errors_1.BusinessOwnershipError();
        }
        try {
            const business = await this.prismaClient.businesses.update({
                where: { id: businessId },
                data: { is_active: true },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    legal_form: true,
                    registration_number: true,
                    tax_id: true,
                    currency: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            const settings = await this.ensureBusinessSettings(businessId);
            return { business, settings };
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new errors_1.BusinessNotFoundError();
            }
            if (err instanceof errors_1.BusinessOwnershipError) {
                throw err;
            }
            throw err;
        }
    }
    async ensureBusinessSettings(businessId) {
        const existing = await this.prismaClient.business_settings.findUnique({
            where: { business_id: businessId },
            select: {
                business_id: true,
                invoice_prefix: true,
                invoice_next_number: true,
                quote_prefix: true,
                quote_next_number: true,
                default_vat_rate: true,
                default_payment_terms_days: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (existing) {
            return existing;
        }
        const created = await this.prismaClient.business_settings.create({
            data: {
                business_id: businessId,
                invoice_prefix: 'INV-',
                invoice_next_number: 1,
                quote_prefix: 'Q-',
                quote_next_number: 1,
                default_vat_rate: null,
                default_payment_terms_days: 30,
            },
            select: {
                business_id: true,
                invoice_prefix: true,
                invoice_next_number: true,
                quote_prefix: true,
                quote_next_number: true,
                default_vat_rate: true,
                default_payment_terms_days: true,
                created_at: true,
                updated_at: true,
            },
        });
        return created;
    }
}
exports.BusinessService = BusinessService;
exports.businessService = new BusinessService(prisma_1.prisma);
