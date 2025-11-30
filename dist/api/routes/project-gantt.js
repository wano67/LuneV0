"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProjectGanttRoutes = registerProjectGanttRoutes;
const zod_1 = require("zod");
const project_gantt_1 = require("@/api/schemas/project-gantt");
const project_gantt_service_1 = require("@/modules/project/project-gantt.service");
const ids_1 = require("@/modules/shared/ids");
async function registerProjectGanttRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/api/v1/projects/:projectId/gantt',
        schema: {
            tags: ['Business – Project Insights'],
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({ projectId: zod_1.z.string() }),
            response: {
                200: zod_1.z.object({ data: project_gantt_1.projectGanttOverviewSchema }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const projectId = (0, ids_1.normalizeProjectId)(BigInt(request.params.projectId));
            const overview = await project_gantt_service_1.projectGanttService.getGantt({ userId, projectId });
            return reply.send({ data: overview });
        },
    });
}
