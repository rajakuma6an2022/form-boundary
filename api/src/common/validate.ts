import type { z } from 'zod';
import { BadRequestError } from './errors';

/** Parses untrusted input. Never echoes the submitted values back, only paths and messages. */
export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestError(
      'Validation failed',
      result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
  return result.data;
}