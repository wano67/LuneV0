"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBusinessProjectsPerformanceRoutes = registerBusinessProjectsPerformanceRoutes;
const zod_1 = require("zod");
const business_projects_performance_1 = require("@/api/schemas/business-projects-performance");
const business_projects_performance_service_1 = require("@/modules/business/business-projects-performance.service");
const ids_1 = require("@/modules/shared/ids");
async function registerBusinessProjectsPerformanceRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/businesses/:businessId/insights/projects-performance',
        schema: {
            tags: ['Business – Project Insights'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ businessId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: business_projects_performance_1.businessProjectsPerformanceSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const businessId = (0, ids_1.normalizeBusinessId)(BigInt(request.params.businessId));
            const data = await business_projects_performance_service_1.businessProjectsPerformanceService.getPerformance({
                userId,
                businessId,
            });
            return reply.send({ data });
        },
    });
}
