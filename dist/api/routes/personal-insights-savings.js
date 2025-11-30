"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalInsightsSavingsPlanRoutes = registerPersonalInsightsSavingsPlanRoutes;
const zod_1 = require("zod");
const personal_insights_savings_1 = require("@/api/schemas/personal-insights-savings");
const personal_insights_savings_service_1 = require("@/modules/personal/personal-insights-savings.service");
const ids_1 = require("@/modules/shared/ids");
async function registerPersonalInsightsSavingsPlanRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/personal/insights/savings-plan',
        schema: {
            tags: ['Personal – Insights'],
            security: [{ bearerAuth: [] }],
            querystring: personal_insights_savings_1.personalSavingsPlanQuerySchema,
            response: {
                200: zod_1.z.object({ data: personal_insights_savings_1.personalSavingsPlanSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const { targetAmount, targetDate, currentSavings } = request.query;
            const plan = await personal_insights_savings_service_1.personalSavingsPlanService.getSavingsPlan(userId, {
                targetAmount,
                targetDate: new Date(`${targetDate}T00:00:00.000Z`),
                currentSavingsOverride: currentSavings,
            });
            return reply.send({ data: plan });
        },
    });
}
