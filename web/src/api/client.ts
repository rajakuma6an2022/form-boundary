import { z } from 'zod';
import { ApiError } from './errors';
import { errorBodySchema, type Session, sessionSchema } from './schemas';

/** The client does not import the store. The store connects itself through this bridge. */
export interface AuthBridge {
  getAccessToken: () => string | null;
  onSession: (session: Session) => void;
  onSessionLost: () => void;
}

let bridge: AuthBridge = {
  getAccessToken: () => null,
  onSession: () => {},
  onSessionLost: () => {},
};

export function configureApi(next: AuthBridge): void {
  bridge = next;
}

export function startSession(session: Session): void {
  bridge.onSession(session);
}

export function endSession(): void {
  bridge.onSessionLost();
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** false for login/register/refresh/logout: no bearer token, no refresh-and-retry. */
  auth?: boolean;
}

const BASE = '/api/v1';

async function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    return await fetch(`${window.location.origin}${BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'same-origin',
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server.');
  }
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null; // e.g. an HTML error page from a proxy
    }
  }

  if (!res.ok) {
    const parsed = errorBodySchema.safeParse(json);
    if (parsed.success) {
      const { code, message, details } = parsed.data.error;
      throw new ApiError(res.status, code, message, details);
    }
    throw new ApiError(res.status, 'HTTP_ERROR', `Request failed with status ${res.status}`);
  }
  return json;
}

async function readData<S extends z.ZodType>(res: Response, schema: S): Promise<z.output<S>> {
  const json = await readJson(res);

  const envelope = z.object({ data: z.unknown() }).safeParse(json);
  if (!envelope.success) {
    throw new ApiError(res.status, 'INVALID_RESPONSE', 'The server sent an unexpected response.');
  }

  const parsed = schema.safeParse(envelope.data.data);
  if (!parsed.success) {
    throw new ApiError(res.status, 'INVALID_RESPONSE', 'The server sent an unexpected response.');
  }
  return parsed.data as z.output<S>;
}

// ---- single-flight refresh: many 401s share ONE request ----
let inflight: Promise<Session> | null = null;

export function refreshSession(): Promise<Session> {
  if (!inflight) {
    inflight = (async () => {
      const res = await send('/auth/refresh', { method: 'POST', body: {} }, null);
      const session = await readData(res, sessionSchema);
      bridge.onSession(session);
      return session;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function execute(path: string, options: RequestOptions): Promise<Response> {
  const useAuth = options.auth !== false;
  const usedToken = useAuth ? bridge.getAccessToken() : null;
  const res = await send(path, options, usedToken);
  if (res.status !== 401 || !useAuth) return res;

  // The token may already have been replaced while this request was in flight.
  const current = bridge.getAccessToken();
  if (!current || current === usedToken) {
    try {
      await refreshSession();
    } catch (err) {
      // Log out only when the server says the session is invalid. A network error or a 5xx
      // (for example a sleeping free-tier server) must not sign the user out.
      if (err instanceof ApiError && err.status === 401) bridge.onSessionLost();
      return res;
    }
  }
  return send(path, options, bridge.getAccessToken()); // retry exactly once
}

export async function apiRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  options: RequestOptions = {},
): Promise<z.output<S>> {
  return readData(await execute(path, options), schema);
}

export async function apiRequestVoid(path: string, options: RequestOptions = {}): Promise<void> {
  await readJson(await execute(path, options));
}