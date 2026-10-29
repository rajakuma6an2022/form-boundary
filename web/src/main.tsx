import '@fontsource-variable/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { connectApiToStore } from './api/connect';
import { App } from './App';
import { bootstrapSession } from './features/auth/bootstrap';
import './index.css';
import { queryClient } from './lib/query-client';
import { store } from './store';

connectApiToStore(store);
void bootstrapSession(store.dispatch); // once, outside React, so StrictMode cannot run it twice

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);