import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  businessTransactionListSchema,
  businessTransactionSchema,
  createBusinessTransactionBodySchema,
  listBusinessTransactionsQuerySchema,
  updateBusinessTransactionBodySchema,
} from '@/api/schemas/business-transaction';
import { businessTransactionsService } from '@/modules/business/business-transactions.service';
import { normalizeAccountId, normalizeBusinessId, normalizeTransactionId, normalizeUserId } from '@/modules/shared/ids';

const toBusinessTransactionDto = (tx: any) => ({
  id: tx.id.toString(),
  userId: tx.user_id.toString(),
  businessId: tx.business_id!.toString(),
  accountId: tx.account_id.toString(),
  direction: tx.direction,
  amount: Number(tx.amount),
  currency: tx.currency ?? '',
  occurredAt: tx.date.toISOString(),
  label: tx.label,
  category: tx.category_id ? tx.category_id.toString() : null,
  notes: tx.notes ?? null,
  createdAt: tx.created_at.toISOString(),
  updatedAt: tx.updated_at.toISOString(),
});

const parseDateOnlyToUtc = (dateStr?: string | null) => {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
};

export async function registerBusinessTransactionRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/businesses/:businessId/transactions',
    schema: {
      tags: ['Business – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      querystring: listBusinessTransactionsQuerySchema,
      response: {
        200: z.object({ data: businessTransactionListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const { accountId, dateFrom, dateTo, direction } = request.query;
      const txs = await businessTransactionsService.listForBusiness(userId, businessId, {
        accountId: accountId ? normalizeAccountId(BigInt(accountId)) : undefined,
        dateFrom: parseDateOnlyToUtc(dateFrom),
        dateTo: parseDateOnlyToUtc(dateTo),
        direction: direction as any,
      });
      return reply.send({ data: txs.map(toBusinessTransactionDto) });
    },
  });

  server.route({
    method: 'POST',
    url: '/businesses/:businessId/transactions',
    schema: {
      tags: ['Business – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string() }),
      body: createBusinessTransactionBodySchema,
      response: {
        201: z.object({ data: businessTransactionSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const body = request.body;
      const created = await businessTransactionsService.create({
        userId,
        businessId,
        accountId: BigInt(body.accountId),
        direction: body.direction,
        amount: body.amount,
        occurredAt: parseDateOnlyToUtc(body.occurredAt) ?? new Date(),
        label: body.label,
        category: body.category ?? null,
        notes: body.notes ?? null,
      });
      return reply.code(201).send({ data: toBusinessTransactionDto(created) });
    },
  });

  server.route({
    method: 'GET',
    url: '/businesses/:businessId/transactions/:transactionId',
    schema: {
      tags: ['Business – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), transactionId: z.string() }),
      response: {
        200: z.object({ data: businessTransactionSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const txId = normalizeTransactionId(BigInt(request.params.transactionId));
      const tx = await businessTransactionsService.getForUser(userId, businessId, txId);
      return reply.send({ data: toBusinessTransactionDto(tx) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/businesses/:businessId/transactions/:transactionId',
    schema: {
      tags: ['Business – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), transactionId: z.string() }),
      body: updateBusinessTransactionBodySchema,
      response: {
        200: z.object({ data: businessTransactionSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const txId = normalizeTransactionId(BigInt(request.params.transactionId));
      const body = request.body;
      const updated = await businessTransactionsService.update(userId, businessId, txId, {
        accountId: body.accountId ? BigInt(body.accountId) : undefined,
        direction: body.direction,
        amount: body.amount,
        occurredAt: body.occurredAt ? parseDateOnlyToUtc(body.occurredAt) : undefined,
        label: body.label,
        category: body.category,
        notes: body.notes,
      });
      return reply.send({ data: toBusinessTransactionDto(updated) });
    },
  });

  server.route({
    method: 'DELETE',
    url: '/businesses/:businessId/transactions/:transactionId',
    schema: {
      tags: ['Business – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ businessId: z.string(), transactionId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const businessId = normalizeBusinessId(BigInt(request.params.businessId));
      const txId = normalizeTransactionId(BigInt(request.params.transactionId));
      await businessTransactionsService.delete(userId, businessId, txId);
      return reply.code(204).send(null);
    },
  });
}
