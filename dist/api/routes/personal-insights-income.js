"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalInsightsIncomeRoutes = registerPersonalInsightsIncomeRoutes;
const zod_1 = require("zod");
const personal_insights_income_sources_1 = require("@/api/schemas/personal-insights-income-sources");
const personal_insights_income_service_1 = require("@/modules/personal/personal-insights-income.service");
const ids_1 = require("@/modules/shared/ids");
const dateOnlySchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
async function registerPersonalInsightsIncomeRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/personal/insights/income-sources',
        schema: {
            tags: ['Personal – Insights'],
            security: [{ bearerAuth: [] }],
            querystring: zod_1.z.object({
                from: dateOnlySchema.optional(),
                to: dateOnlySchema.optional(),
            }),
            response: {
                200: zod_1.z.object({ data: personal_insights_income_sources_1.personalIncomeSourcesSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const qs = request.query;
            const data = await personal_insights_income_service_1.personalInsightsIncomeService.incomeSources({
                userId,
                from: qs.from,
                to: qs.to,
            });
            return reply.send({ data });
        },
    });
}
