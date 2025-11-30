"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessInsightsClientsRoutes = registerBusinessInsightsClientsRoutes;
const zod_1 = require("zod");
const business_insights_clients_1 = require("@/api/schemas/business-insights-clients");
const business_insights_clients_service_1 = require("@/modules/business/business-insights-clients.service");
const ids_1 = require("@/modules/shared/ids");
const dateOnlySchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
async function registerBusinessInsightsClientsRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/insights/top-clients',
        schema: {
            tags: ['Business – Revenue Insights'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            querystring: zod_1.z.object({
                from: dateOnlySchema.optional(),
                to: dateOnlySchema.optional(),
            }),
            response: {
                200: zod_1.z.object({ data: business_insights_clients_1.businessTopClientsSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const qs = request.query;
            const fromDate = qs.from ? new Date(`${qs.from}T00:00:00.000Z`) : undefined;
            const toDate = qs.to ? new Date(`${qs.to}T00:00:00.000Z`) : undefined;
            const data = await business_insights_clients_service_1.businessInsightsClientsService.getTopClients({
                userId,
                businessId,
                from: fromDate,
                to: toDate,
            });
            return reply.send({ data });
        },
    });
}
