import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  createPersonalTransactionBodySchema,
  listPersonalTransactionsQuerySchema,
  personalTransactionListSchema,
  personalTransactionSchema,
  updatePersonalTransactionBodySchema,
} from '@/api/schemas/personal-transaction';
import { personalTransactionsService } from '@/modules/personal/personal-transactions.service';
import { normalizeTransactionId, normalizeUserId, normalizeAccountId } from '@/modules/shared/ids';

const parseDateOnly = (value?: string | null) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined);

const toTransactionDto = (tx: any) => ({
  id: tx.id.toString(),
  userId: tx.user_id.toString(),
  accountId: tx.account_id.toString(),
  direction: tx.direction,
  amount: Number(tx.amount ?? tx.amount),
  currency: tx.currency ?? '',
  occurredAt: tx.date.toISOString(),
  label: tx.label,
  category: tx.notes ?? null,
  notes: tx.notes ?? null,
  createdAt: tx.created_at.toISOString(),
  updatedAt: tx.updated_at.toISOString(),
});

export async function registerPersonalTransactionRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: 'GET',
    url: '/personal/transactions',
    schema: {
      tags: ['Personal – Transactions'],
      security: [{ bearerAuth: [] }],
      querystring: listPersonalTransactionsQuerySchema,
      response: {
        200: z.object({ data: personalTransactionListSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const { accountId, dateFrom, dateTo, direction, category } = request.query;
      const txs = await personalTransactionsService.list(userId, {
        accountId: accountId ? normalizeAccountId(BigInt(accountId)) : undefined,
        dateFrom: parseDateOnly(dateFrom),
        dateTo: parseDateOnly(dateTo),
        direction: direction as any,
        category: category,
      });
      return reply.send({ data: txs.map(toTransactionDto) });
    },
  });

  server.route({
    method: 'POST',
    url: '/personal/transactions',
    schema: {
      tags: ['Personal – Transactions'],
      security: [{ bearerAuth: [] }],
      body: createPersonalTransactionBodySchema,
      response: {
        201: z.object({ data: personalTransactionSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const body = request.body;
      const created = await personalTransactionsService.create({
        userId,
        accountId: BigInt(body.accountId),
        direction: body.direction,
        amount: body.amount,
        occurredAt: parseDateOnly(body.occurredAt) ?? new Date(),
        label: body.label,
        category: body.category,
        notes: body.notes,
      });
      return reply.code(201).send({ data: toTransactionDto(created) });
    },
  });

  server.route({
    method: 'GET',
    url: '/personal/transactions/:transactionId',
    schema: {
      tags: ['Personal – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ transactionId: z.string() }),
      response: {
        200: z.object({ data: personalTransactionSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const tx = await personalTransactionsService.getById(userId, normalizeTransactionId(BigInt(request.params.transactionId)));
      return reply.send({ data: toTransactionDto(tx) });
    },
  });

  server.route({
    method: 'PATCH',
    url: '/personal/transactions/:transactionId',
    schema: {
      tags: ['Personal – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ transactionId: z.string() }),
      body: updatePersonalTransactionBodySchema,
      response: {
        200: z.object({ data: personalTransactionSchema }),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const txId = normalizeTransactionId(BigInt(request.params.transactionId));
      const body = request.body;
      const updated = await personalTransactionsService.update(userId, txId, {
        direction: body.direction,
        amount: body.amount,
        occurredAt: body.occurredAt ? parseDateOnly(body.occurredAt) : undefined,
        label: body.label,
        category: body.category,
        notes: body.notes,
      });
      return reply.send({ data: toTransactionDto(updated) });
    },
  });

  server.route({
    method: 'DELETE',
    url: '/personal/transactions/:transactionId',
    schema: {
      tags: ['Personal – Transactions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ transactionId: z.string() }),
      response: {
        204: z.null(),
      },
    },
    preHandler: app.authenticate,
    async handler(request, reply) {
      const userId = normalizeUserId(BigInt((request.user as any).id ?? (request.user as any).sub));
      const txId = normalizeTransactionId(BigInt(request.params.transactionId));
      await personalTransactionsService.delete(userId, txId);
      return reply.code(204).send(null);
    },
  });
}
