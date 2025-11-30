"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalInsightsScoreRoutes = registerPersonalInsightsScoreRoutes;
const zod_1 = require("zod");
const personal_insights_score_1 = require("@/api/schemas/personal-insights-score");
const personal_insights_score_service_1 = require("@/modules/personal/personal-insights-score.service");
const ids_1 = require("@/modules/shared/ids");
async function registerPersonalInsightsScoreRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/personal/insights/score',
        schema: {
            tags: ['Personal – Insights'],
            security: [{ bearerAuth: [] }],
            querystring: zod_1.z.object({
                months: zod_1.z.string().regex(/^\d+$/).transform((v) => Number(v)).optional(),
            }),
            response: {
                200: zod_1.z.object({ data: personal_insights_score_1.personalScoreSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const monthsStr = request.query.months;
            const months = typeof monthsStr === 'number' && !Number.isNaN(monthsStr) ? monthsStr : undefined;
            const data = await personal_insights_score_service_1.personalInsightsScoreService.getScore({ userId, months });
            return reply.send({ data });
        },
    });
}
