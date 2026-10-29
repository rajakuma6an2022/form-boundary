import { ApiError } from '../../api/errors';
import { refreshSession } from '../../api/client';
import { bootstrapFailed, bootstrapStarted, sessionCleared } from '../../store/auth-slice';
import type { AppDispatch } from '../../store';

/** Runs once at startup (and on Retry): asks the server whether the refresh cookie is still valid. */
export async function bootstrapSession(dispatch: AppDispatch): Promise<void> {
  dispatch(bootstrapStarted());
  try {
    await refreshSession(); // on success the bridge dispatches sessionStarted
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) dispatch(sessionCleared());
    else dispatch(bootstrapFailed()); // network error or 5xx: not the same as "logged out"
  }
}