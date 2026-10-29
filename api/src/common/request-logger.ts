import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from './logger';

// Only accept a client-supplied id if it is short and boring (prevents log injection).
const SAFE_ID = /^[\w-]{8,64}$/;

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && SAFE_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
});