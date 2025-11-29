import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  businessSchema,
  businessSettingsSchema,
  businessListSchema,
  createBusinessBodySchema,
  updateBusinessProfileBodySchema,
  updateBusinessSettingsBodySchema,
} from '@/api/schemas/business';
import { businessService, type BusinessWithSettings } from '@/modules/business/business.service';
import { normalizeBusinessId } from '@/modules/shared/ids';

type DecimalLike = { toNumber: () => number } | number | null;

const decimalToNumber = (value: DecimalLike): number | null => {
  if (value === null) return null;
  return typeof value === 'number' ? value : value.toNumber();
};

const toBusinessDto = (business: BusinessWithSettings['business']) => ({
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

const toBusinessSettingsDto = (settings: BusinessWithSettings['settings']) => ({
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

export async function registerBusinessRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'POST',
    url: '/api/v1/businesses',
    schema: {
      tags: ['Business – Core'],
      body: createBusinessBodySchema,
      response: {
        201: z.object({ data: z.object({ business: businessSchema, settings: businessSettingsSchema }) }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const {
        name,
        legalForm,
        registrationNumber,
        taxId,
        currency,
        invoicePrefix,
        quotePrefix,
        defaultVatRate,
        defaultPaymentTermsDays,
      } = request.body;

      const { business, settings } = await businessService.createBusinessWithDefaultSettings({
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

  server.route({
    method: 'GET',
    url: '/api/v1/businesses',
    schema: {
      tags: ['Business – Core'],
      response: {
        200: z.object({ data: businessListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businesses = await businessService.listBusinessesForUser(userId);

      return reply.send({
        data: businesses.map((item) => ({
          business: toBusinessDto(item.business),
          settings: toBusinessSettingsDto(item.settings),
        })),
      });
    },
  });

  server.route({
    method: 'GET',
    url: '/api/v1/businesses/:businessId',
    schema: {
      tags: ['Business – Core'],
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({ data: z.object({ business: businessSchema, settings: businessSettingsSchema }) }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const { business, settings } = await businessService.getBusinessWithSettingsForUser(businessId, userId);

      return reply.send({
        data: {
          business: toBusinessDto(business),
          settings: toBusinessSettingsDto(settings),
        },
      });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/api/v1/businesses/:businessId/profile',
    schema: {
      tags: ['Business – Core'],
      params: z.object({ businessId: z.string() }),
      body: updateBusinessProfileBodySchema,
      response: {
        200: z.object({ data: businessSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const { business } = await businessService.updateBusinessProfile(businessId, userId, request.body);

      return reply.send({
        data: toBusinessDto(business),
      });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/api/v1/businesses/:businessId/settings',
    schema: {
      tags: ['Business – Core'],
      params: z.object({ businessId: z.string() }),
      body: updateBusinessSettingsBodySchema,
      response: {
        200: z.object({ data: businessSettingsSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = BigInt(request.user.id);
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));

      const { settings } = await businessService.updateBusinessSettings(businessId, userId, request.body);

      return reply.send({
        data: toBusinessSettingsDto(settings),
      });
    },
  });
}
