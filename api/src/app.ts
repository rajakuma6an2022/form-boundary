import cookieParser from 'cookie-parser';
import express, { type Express, type Router } from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './common/error-handler';
import { requestLogger } from './common/request-logger';
import { type AuthLimits, createAuthRouter } from './modules/auth/auth.routes';
import { healthRouter } from './routes/health';

export interface AppDeps {
  ping: () => Promise<void>;
  /** Extra routers mounted under /api/v1 (used by tests). */
  routers?: Router[];
  /** Override auth rate limits (tests). */
  authLimits?: Partial<AuthLimits>;
}

export function createApp({ ping, routers = [], authLimits }: AppDeps): Express {
  const app = express();

  app.set('trust proxy', 1); // behind Render/Vercel: one proxy hop
  app.use(helmet());
  app.use(requestLogger);
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api/v1', healthRouter({ ping }));
  app.use('/api/v1/auth', createAuthRouter(authLimits));
  for (const router of routers) app.use('/api/v1', router);

  app.use(notFoundHandler);
  app.use(errorHandler); // always last

  return app;
}