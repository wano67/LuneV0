"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessInsightsServicesRoutes = registerBusinessInsightsServicesRoutes;
const zod_1 = require("zod");
const business_insights_services_1 = require("@/api/schemas/business-insights-services");
const business_insights_services_service_1 = require("@/modules/business/business-insights-services.service");
const ids_1 = require("@/modules/shared/ids");
const dateOnlySchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
async function registerBusinessInsightsServicesRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/insights/top-services',
        schema: {
            tags: ['Business – Revenue Insights'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            querystring: zod_1.z.object({
                from: dateOnlySchema.optional(),
                to: dateOnlySchema.optional(),
            }),
            response: {
                200: zod_1.z.object({ data: business_insights_services_1.businessTopServicesSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const qs = request.query;
            const fromDate = qs.from ? new Date(`${qs.from}T00:00:00.000Z`) : undefined;
            const toDate = qs.to ? new Date(`${qs.to}T00:00:00.000Z`) : undefined;
            const data = await business_insights_services_service_1.businessInsightsServicesService.getTopServices({
                userId,
                businessId,
                from: fromDate,
                to: toDate,
            });
            return reply.send({ data });
        },
    });
}
