"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authTokenResponseSchema = exports.authUserSchema = exports.loginBodySchema = exports.signupBodySchema = void 0;
// src/api/schemas/auth.ts
const zod_1 = require("zod");
exports.signupBodySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    displayName: zod_1.z.string().min(1),
});
exports.loginBodySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.authUserSchema = zod_1.z.object({
    id: zod_1.z.string(), // on envoie les ids en string côté HTTP
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().nullable(),
});
exports.authTokenResponseSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    user: exports.authUserSchema,
});
