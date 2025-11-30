"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHealthRoutes = registerHealthRoutes;
const zod_1 = require("zod");
async function registerHealthRoutes(app) {
    app
        .withTypeProvider()
        .route({
        method: 'GET',
        url: '/api/v1/health',
        schema: {
            description: 'Healthcheck simple du backend',
            tags: ['Health'],
            response: {
                200: zod_1.z.object({
                    data: zod_1.z.object({
                        status: zod_1.z.literal('ok'),
                        uptime: zod_1.z.number(),
                    }),
                }),
            },
        },
        async handler(_request, reply) {
            const payload = {
                status: 'ok',
                uptime: process.uptime(),
            };
            return reply.send({ data: payload });
        },
    });
}
