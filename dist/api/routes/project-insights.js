"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProjectInsightsRoutes = registerProjectInsightsRoutes;
const zod_1 = require("zod");
const project_insights_1 = require("@/api/schemas/project-insights");
const project_insights_service_1 = require("@/modules/project/project-insights.service");
const ids_1 = require("@/modules/shared/ids");
async function registerProjectInsightsRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/projects/:projectId/insights',
        schema: {
            tags: ['Business – Project Insights'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: project_insights_1.projectInsightsOverviewSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            const overview = await project_insights_service_1.projectInsightsService.getOverview(userId, projectId);
            return reply.send({ data: overview });
        },
    });
}
