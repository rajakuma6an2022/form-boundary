import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(10, 'must be at least 10 characters').max(128);

// .strict(): unknown keys are rejected. Every field is a string, so { "$ne": null } fails here,
// before any database query runs.
export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email,
    password,
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(128), // login does not enforce the length rule, only register does
  })
  .strict();

export type RegisterInput = z.output<typeof registerSchema>;
export type LoginInput = z.output<typeof loginSchema>;