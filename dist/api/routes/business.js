"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessRoutes = registerBusinessRoutes;
const zod_1 = require("zod");
const business_1 = require("@/api/schemas/business");
const business_service_1 = require("@/modules/business/business.service");
const ids_1 = require("@/modules/shared/ids");
const decimalToNumber = (value) => {
    if (value === null)
        return null;
    return typeof value === 'number' ? value : value.toNumber();
};
const toBusinessDto = (business) => ({
    id: business.id.toString(),
    userId: business.user_id.toString(),
    name: business.name,
    legalForm: business.legal_form,
    registrationNumber: business.registration_number,
    taxId: business.tax_id,
    currency: business.currency,
    isActive: business.is_active,
    createdAt: business.created_at.toISOString(),
    updatedAt: business.updated_at.toISOString(),
});
const toBusinessSettingsDto = (settings) => ({
    businessId: settings.business_id.toString(),
    invoicePrefix: settings.invoice_prefix,
    invoiceNextNumber: settings.invoice_next_number,
    quotePrefix: settings.quote_prefix,
    quoteNextNumber: settings.quote_next_number,
    defaultVatRate: decimalToNumber(settings.default_vat_rate ?? null),
    defaultPaymentTermsDays: settings.default_payment_terms_days,
    createdAt: settings.created_at.toISOString(),
    updatedAt: settings.updated_at.toISOString(),
});
async function registerBusinessRoutes(app) {
    // 1) Créer une entreprise + settings par défaut
    app.route({
        method: 'POST',
        url: '/api/v1/businesses',
        schema: {
            tags: ['Business – Core'],
            body: business_1.createBusinessBodySchema,
            response: {
                201: zod_1.z.object({
                    data: zod_1.z.object({
                        business: business_1.businessSchema,
                        settings: business_1.businessSettingsSchema,
                    }),
                }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const { name, legalForm, registrationNumber, taxId, currency, invoicePrefix, quotePrefix, defaultVatRate, defaultPaymentTermsDays, } = request.body;
            const { business, settings } = await business_service_1.businessService.createBusinessWithDefaultSettings({
                userId,
                name,
                legalForm,
                registrationNumber,
                taxId,
                currency,
                invoicePrefix,
                quotePrefix,
                defaultVatRate,
                defaultPaymentTermsDays,
            });
            return reply.code(201).send({
                data: {
                    business: toBusinessDto(business),
                    settings: toBusinessSettingsDto(settings),
                },
            });
        },
    });
    // 2) Lister les business de l’utilisateur
    app.route({
        method: 'GET',
        url: '/api/v1/businesses',
        schema: {
            tags: ['Business – Core'],
            response: {
                200: zod_1.z.object({ data: business_1.businessListSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businesses = await business_service_1.businessService.listBusinessesForUser(userId);
            return reply.send({
                data: businesses.map((item) => ({
                    business: toBusinessDto(item.business),
                    settings: toBusinessSettingsDto(item.settings),
                })),
            });
        },
    });
    // 3) Récupérer un business + settings
    app.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId',
        schema: {
            tags: ['Business – Core'],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({
                    data: zod_1.z.object({
                        business: business_1.businessSchema,
                        settings: business_1.businessSettingsSchema,
                    }),
                }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const { businessId } = (request.params ?? {});
            const normalizedId = (0, ids_1.normalizeBusinessId)(BigInt(businessId));
            const { business, settings } = await business_service_1.businessService.getBusinessWithSettingsForUser(normalizedId, userId);
            return reply.send({
                data: {
                    business: toBusinessDto(business),
                    settings: toBusinessSettingsDto(settings),
                },
            });
        },
    });
    // 4) Mettre à jour le profil d’un business
    app.route({
        method: 'PATCH',
        url: '/api/v1/businesses/:businessId/profile',
        schema: {
            tags: ['Business – Core'],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: business_1.updateBusinessProfileBodySchema,
            response: {
                200: zod_1.z.object({ data: business_1.businessSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const { businessId } = (request.params ?? {});
            const normalizedId = (0, ids_1.normalizeBusinessId)(BigInt(businessId));
            const body = request.body;
            const { business } = await business_service_1.businessService.updateBusinessProfile(normalizedId, userId, body);
            return reply.send({
                data: toBusinessDto(business),
            });
        },
    });
    // 5) Mettre à jour les settings d’un business
    app.route({
        method: 'PATCH',
        url: '/api/v1/businesses/:businessId/settings',
        schema: {
            tags: ['Business – Core'],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            body: business_1.updateBusinessSettingsBodySchema,
            response: {
                200: zod_1.z.object({ data: business_1.businessSettingsSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const { businessId } = (request.params ?? {});
            const normalizedId = (0, ids_1.normalizeBusinessId)(BigInt(businessId));
            const body = request.body;
            const { settings } = await business_service_1.businessService.updateBusinessSettings(normalizedId, userId, body);
            return reply.send({
                data: toBusinessSettingsDto(settings),
            });
        },
    });
    // 6) Récupérer le business « actif » (on prend le premier de la liste) + membre courant (null)
    app.route({
        method: 'GET',
        url: '/api/v1/businesses/active',
        schema: {
            tags: ['Business – Core'],
            response: {
                200: zod_1.z.object({
                    data: zod_1.z.object({
                        business: business_1.businessSchema,
                        settings: business_1.businessSettingsSchema,
                        currentMember: zod_1.z
                            .object({
                            role: zod_1.z.string(),
                            joinedAt: zod_1.z.string(),
                            isActive: zod_1.z.boolean(),
                        })
                            .nullable(),
                    }),
                }),
                404: zod_1.z.object({
                    error: zod_1.z.object({
                        code: zod_1.z.string(),
                        message: zod_1.z.string(),
                    }),
                }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = BigInt(request.user.id);
            const businesses = await business_service_1.businessService.listBusinessesForUser(userId);
            if (!businesses.length) {
                return reply
                    .code(404)
                    .send({ error: { code: 'not_found', message: 'No active business' } });
            }
            const first = businesses[0];
            return reply.send({
                data: {
                    business: toBusinessDto(first.business),
                    settings: toBusinessSettingsDto(first.settings),
                    currentMember: null,
                },
            });
        },
    });
}
