import { describe, expect, it } from 'vitest';
import {
  authReducer,
  bootstrapFailed,
  bootstrapStarted,
  initialAuthState,
  sessionCleared,
  sessionStarted,
} from './auth-slice';
import { makeStore } from './index';

const user = { id: 'u1', name: 'Raja', email: 'raja@example.com' };

describe('auth slice', () => {
  it('starts in bootstrapping with no user and no token', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual({
      user: null,
      accessToken: null,
      status: 'bootstrapping',
    });
  });

  it('stores the session on sessionStarted', () => {
    const state = authReducer(initialAuthState, sessionStarted({ user, accessToken: 'tok' }));
    expect(state).toEqual({ user, accessToken: 'tok', status: 'authenticated' });
  });

  it('wipes everything on sessionCleared', () => {
    const signedIn = authReducer(initialAuthState, sessionStarted({ user, accessToken: 'tok' }));
    expect(authReducer(signedIn, sessionCleared())).toEqual({ user: null, accessToken: null, status: 'anonymous' });
  });

  it('marks bootstrap failure and restart', () => {
    expect(authReducer(initialAuthState, bootstrapFailed()).status).toBe('error');
    expect(authReducer({ ...initialAuthState, status: 'error' }, bootstrapStarted()).status).toBe('bootstrapping');
  });

  it('never writes the token to browser storage', () => {
    const store = makeStore();
    store.dispatch(sessionStarted({ user, accessToken: 'secret-token' }));
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});