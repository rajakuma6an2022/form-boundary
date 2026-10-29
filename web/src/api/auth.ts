import { apiRequest, apiRequestVoid, endSession, startSession } from './client';
import { type Session, sessionSchema } from './schemas';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export async function login(input: LoginInput): Promise<Session> {
  const session = await apiRequest('/auth/login', sessionSchema, { method: 'POST', body: input, auth: false });
  startSession(session);
  return session;
}

export async function registerAccount(input: RegisterInput): Promise<Session> {
  const session = await apiRequest('/auth/register', sessionSchema, { method: 'POST', body: input, auth: false });
  startSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await apiRequestVoid('/auth/logout', { method: 'POST', body: {}, auth: false });
  } catch {
    // Even if the server cannot be reached, sign out locally.
  } finally {
    endSession();
  }
}