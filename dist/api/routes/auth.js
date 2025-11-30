"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = registerAuthRoutes;
const zod_1 = require("zod");
const auth_1 = require("@/api/schemas/auth");
const user_service_1 = require("@/modules/user/user.service");
const prisma_1 = require("@/lib/prisma");
async function registerAuthRoutes(app) {
    const server = app.withTypeProvider();
    // SIGNUP
    server.route({
        method: 'POST',
        url: '/api/v1/auth/signup',
        schema: {
            tags: ['Auth'],
            body: auth_1.signupBodySchema,
            response: {
                201: zod_1.z.object({ data: auth_1.authTokenResponseSchema }),
            },
        },
        async handler(request, reply) {
            const { email, password, displayName } = request.body;
            // TODO: en prod, hasher le password
            const { user } = await user_service_1.userService.createUserWithDefaultSettings({
                email,
                passwordHash: password,
                displayName,
            });
            const accessToken = await reply.jwtSign({ sub: user.id.toString() });
            return reply.code(201).send({
                data: {
                    accessToken,
                    user: {
                        id: user.id.toString(),
                        email: user.email,
                        displayName: user.display_name ?? null,
                    },
                },
            });
        },
    });
    // LOGIN
    server.route({
        method: 'POST',
        url: '/api/v1/auth/login',
        schema: {
            tags: ['Auth'],
            body: auth_1.loginBodySchema,
            response: {
                200: zod_1.z.object({ data: auth_1.authTokenResponseSchema }),
                401: zod_1.z.object({
                    error: zod_1.z.object({
                        code: zod_1.z.literal('invalid_credentials'),
                        message: zod_1.z.string(),
                    }),
                }),
            },
        },
        async handler(request, reply) {
            const { email, password } = request.body;
            const user = await prisma_1.prisma.users.findUnique({
                where: { email },
            });
            // TODO: comparer password hash correctement
            if (!user || user.password_hash !== password) {
                return reply.code(401).send({
                    error: {
                        code: 'invalid_credentials',
                        message: 'Invalid email or password',
                    },
                });
            }
            const accessToken = await reply.jwtSign({ sub: user.id.toString() });
            return reply.send({
                data: {
                    accessToken,
                    user: {
                        id: user.id.toString(),
                        email: user.email,
                        displayName: user.display_name ?? null,
                    },
                },
            });
        },
    });
    // ME
    server.route({
        method: 'GET',
        url: '/api/v1/me',
        schema: {
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.z.object({ data: auth_1.authUserSchema }),
                404: zod_1.z.object({
                    error: zod_1.z.object({
                        code: zod_1.z.literal('user_not_found'),
                        message: zod_1.z.string(),
                    }),
                }),
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userIdStr = request.user.id; // rempli par authPlugin
            const userId = BigInt(userIdStr);
            const user = await prisma_1.prisma.users.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return reply.code(404).send({
                    error: { code: 'user_not_found', message: 'User not found' },
                });
            }
            return reply.send({
                data: {
                    id: user.id.toString(),
                    email: user.email,
                    displayName: user.display_name ?? null,
                },
            });
        },
    });
}
