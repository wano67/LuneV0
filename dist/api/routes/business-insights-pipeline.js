"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessInsightsPipelineRoutes = registerBusinessInsightsPipelineRoutes;
const zod_1 = require("zod");
const business_insights_pipeline_1 = require("@/api/schemas/business-insights-pipeline");
const business_insights_pipeline_service_1 = require("@/modules/business/business-insights-pipeline.service");
const ids_1 = require("@/modules/shared/ids");
async function registerBusinessInsightsPipelineRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/insights/pipeline',
        schema: {
            tags: ['Business – Project Insights'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: business_insights_pipeline_1.businessPipelineInsightsSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const data = await business_insights_pipeline_service_1.businessInsightsPipelineService.getPipeline({ userId, businessId });
            return reply.send({ data });
        },
    });
}
