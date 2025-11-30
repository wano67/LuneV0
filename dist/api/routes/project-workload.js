"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProjectWorkloadRoutes = registerProjectWorkloadRoutes;
const zod_1 = require("zod");
const project_workload_1 = require("@/api/schemas/project-workload");
const project_workload_service_1 = require("@/modules/project/project-workload.service");
const ids_1 = require("@/modules/shared/ids");
const dateOnlySchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
async function registerProjectWorkloadRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/projects/:projectId/workload',
        schema: {
            tags: ['Business – Project Insights'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            querystring: zod_1.z.object({
                from: dateOnlySchema.optional(),
                to: dateOnlySchema.optional(),
                granularity: zod_1.z.enum(['week', 'month']).optional(),
            }),
            response: {
                200: zod_1.z.object({ data: project_workload_1.projectWorkloadOverviewSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            const qs = request.query;
            const fromDate = qs.from ? new Date(`${qs.from}T00:00:00.000Z`) : undefined;
            const toDate = qs.to ? new Date(`${qs.to}T00:00:00.000Z`) : undefined;
            const overview = await project_workload_service_1.projectWorkloadService.getWorkload({
                userId,
                projectId,
                from: fromDate,
                to: toDate,
                granularity: qs.granularity,
            });
            return reply.send({ data: overview });
        },
    });
}
