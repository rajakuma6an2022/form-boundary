import { sessionCleared, sessionStarted } from '../store/auth-slice';
import type { AppStore } from '../store';
import { configureApi } from './client';

export function connectApiToStore(store: AppStore): void {
  configureApi({
    getAccessToken: () => store.getState().auth.accessToken,
    onSession: (session) => {
      store.dispatch(sessionStarted(session));
    },
    onSessionLost: () => {
      store.dispatch(sessionCleared());
    },
  });
}