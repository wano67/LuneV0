"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalInsightsRoutes = registerPersonalInsightsRoutes;
const zod_1 = require("zod");
const personal_insights_1 = require("@/api/schemas/personal-insights");
const personal_insights_service_1 = require("@/modules/personal/personal-insights.service");
const ids_1 = require("@/modules/shared/ids");
async function registerPersonalInsightsRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/personal/insights/overview',
        schema: {
            tags: ['Personal – Insights'],
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.z.object({ data: personal_insights_1.personalInsightsOverviewSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const overview = await personal_insights_service_1.personalInsightsService.getOverview(userId);
            return reply.send({ data: overview });
        },
    });
}
