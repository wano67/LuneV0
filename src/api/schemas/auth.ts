// src/api/schemas/auth.ts
import { z } from 'zod';

export const signupBodySchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

export const loginBodySchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1),
});

export const authUserSchema = z.object({
  id: z.string(), // on envoie les ids en string côté HTTP
  email: z.string().email(),
  displayName: z.string().nullable(),
});

export const authTokenResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
