import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, NotFoundError } from './errors';
import { logger } from './logger';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Route not found'));
};

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  // Errors thrown by express.json() (body-parser)
  const type = (err as { type?: unknown } | null)?.type;
  if (type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (type === 'entity.parse.failed') {
    return new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
  }

  const status = (err as { status?: unknown } | null)?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return new AppError(status, 'BAD_REQUEST', 'Request could not be processed');
  }

  // Anything else is a bug: never leak its message to the client.
  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = toAppError(err);
  const requestId = res.getHeader('x-request-id');

  if (appError.status >= 500) {
    logger.error({ err, requestId, method: req.method, path: req.path }, 'request failed');
  }

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      requestId,
      ...(appError.details !== undefined ? { details: appError.details } : {}),
    },
  });
};