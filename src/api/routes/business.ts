import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
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
  // 1) Créer une entreprise + settings par défaut
  app.route({
    method: 'POST',
    url: '/api/v1/businesses',
    schema: {
      tags: ['Business – Core'],
      body: createBusinessBodySchema,
      response: {
        201: z.object({
          data: z.object({
            business: businessSchema,
            settings: businessSettingsSchema,
          }),
        }),
      },
    },
    preHandler: app.authenticate,
    async handler(request: FastifyRequest, reply: FastifyReply) {
      const userId = BigInt((request as any).user.id);

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
      } = request.body as z.infer<typeof createBusinessBodySchema>;

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
  } as any);

  // 2) Lister les business de l’utilisateur
  app.route({
    method: 'GET',
    url: '/api/v1/businesses',
    schema: {
      tags: ['Business – Core'],
      response: {
        200: z.object({ data: businessListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request: FastifyRequest, reply: FastifyReply) {
      const userId = BigInt((request as any).user.id);
      const businesses = await businessService.listBusinessesForUser(userId);

      return reply.send({
        data: businesses.map((item) => ({
          business: toBusinessDto(item.business),
          settings: toBusinessSettingsDto(item.settings),
        })),
      });
    },
  } as any);

  // 3) Récupérer un business + settings
  app.route({
    method: 'GET',
    url: '/api/v1/businesses/:businessId',
    schema: {
      tags: ['Business – Core'],
      params: z.object({ businessId: z.string() }),
      response: {
        200: z.object({
          data: z.object({
            business: businessSchema,
            settings: businessSettingsSchema,
          }),
        }),
      },
    },
    preHandler: app.authenticate,
    async handler(request: FastifyRequest, reply: FastifyReply) {
      const userId = BigInt((request as any).user.id);
      const { businessId } = (request.params ?? {}) as { businessId: string };
      const normalizedId = normalizeBusinessId(BigInt(businessId));

      const { business, settings } = await businessService.getBusinessWithSettingsForUser(
        normalizedId,
        userId,
      );

      return reply.send({
        data: {
          business: toBusinessDto(business),
          settings: toBusinessSettingsDto(settings),
        },
      });
    },
  } as any);

  // 4) Mettre à jour le profil d’un business
  app.route({
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
    async handler(request: FastifyRequest, reply: FastifyReply) {
      const userId = BigInt((request as any).user.id);
      const { businessId } = (request.params ?? {}) as { businessId: string };
      const normalizedId = normalizeBusinessId(BigInt(businessId));

      const body = request.body as z.infer<typeof updateBusinessProfileBodySchema>;

      const { business } = await businessService.updateBusinessProfile(normalizedId, userId, body);

      return reply.send({
        data: toBusinessDto(business),
      });
    },
  } as any);

  // 5) Mettre à jour les settings d’un business
  app.route({
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
    async handler(request: FastifyRequest, reply: FastifyReply) {
      const userId = BigInt((request as any).user.id);
      const { businessId } = (request.params ?? {}) as { businessId: string };
      const normalizedId = normalizeBusinessId(BigInt(businessId));

      const body = request.body as z.infer<typeof updateBusinessSettingsBodySchema>;

      const { settings } = await businessService.updateBusinessSettings(normalizedId, userId, body);

      return reply.send({
        data: toBusinessSettingsDto(settings),
      });
    },
  } as any);

  // 6) Récupérer le business « actif » (on prend le premier de la liste) + membre courant (null)
  app.route({
    method: 'GET',
    url: '/api/v1/businesses/active',
    schema: {
      tags: ['Business – Core'],
      response: {
        200: z.object({
          data: z.object({
            business: businessSchema,
            settings: businessSettingsSchema,
            currentMember: z
              .object({
                role: z.string(),
                joinedAt: z.string(),
                isActive: z.boolean(),
              })
              .nullable(),
          }),
        }),
        404: z.object({
          error: z.object({
            code: z.string(),
            message: z.string(),
          }),
        }),
      },
    },
    preHandler: app.authenticate,
    async handler(request: FastifyRequest, reply: FastifyReply) {
      const userId = BigInt((request as any).user.id);

      const businesses = await businessService.listBusinessesForUser(userId);

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
  } as any);
}