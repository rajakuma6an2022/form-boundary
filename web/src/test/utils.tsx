import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { connectApiToStore } from '../api/connect';
import { App } from '../App';
import { createQueryClient } from '../lib/query-client';
import { type AuthState, initialAuthState } from '../store/auth-slice';
import { makeStore } from '../store';

export const USER = { id: 'u1', name: 'Raja Kumar', email: 'raja@example.com' };

export const AUTHENTICATED: Partial<AuthState> = {
  user: USER,
  accessToken: 'test-token',
  status: 'authenticated',
};

export function renderApp(path: string, auth: Partial<AuthState> = {}) {
  const store = makeStore({ auth: { ...initialAuthState, ...auth } });
  connectApiToStore(store);
  const result = render(
    <Provider store={store}>
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return { store, ...result };
}