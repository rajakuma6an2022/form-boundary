import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { AUTHENTICATED, renderApp, USER } from '../../test/utils';
import { bootstrapSession } from './bootstrap';

const session = () => HttpResponse.json({ data: { accessToken: 'tok', user: USER } });
const error = (status: number, code: string, message: string, details?: unknown) =>
  HttpResponse.json({ error: { code, message, details } }, { status });

describe('login page', () => {
  it('shows field errors and does not call the API', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/login', () => {
        calls += 1;
        return session();
      }),
    );
    const ue = userEvent.setup();
    renderApp('/login', { status: 'anonymous' });

    await ue.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(calls).toBe(0);
  });

  it('calls the API once, even on a double click, then lands on /forms', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/login', () => {
        calls += 1;
        return session();
      }),
    );
    const ue = userEvent.setup();
    renderApp('/login', { status: 'anonymous' });

    await ue.type(screen.getByLabelText('Email'), 'raja@example.com');
    await ue.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await ue.dblClick(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Forms' })).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it('shows a server error in the alert region', async () => {
    server.use(http.post('*/api/v1/auth/login', () => error(401, 'UNAUTHORIZED', 'Invalid email or password')));
    const ue = userEvent.setup();
    renderApp('/login', { status: 'anonymous' });

    await ue.type(screen.getByLabelText('Email'), 'raja@example.com');
    await ue.type(screen.getByLabelText('Password'), 'wrong-password-123');
    await ue.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('shows a rate-limit message on 429', async () => {
    server.use(http.post('*/api/v1/auth/login', () => error(429, 'RATE_LIMITED', 'Too many requests')));
    const ue = userEvent.setup();
    renderApp('/login', { status: 'anonymous' });

    await ue.type(screen.getByLabelText('Email'), 'raja@example.com');
    await ue.type(screen.getByLabelText('Password'), 'whatever-password');
    await ue.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText(/Too many attempts/)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const ue = userEvent.setup();
    renderApp('/login', { status: 'anonymous' });
    const input = screen.getByLabelText('Password');

    expect(input).toHaveAttribute('type', 'password');
    await ue.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    await ue.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});

describe('register page', () => {
  it('validates the password length on the client', async () => {
    const ue = userEvent.setup();
    renderApp('/register', { status: 'anonymous' });

    await ue.type(screen.getByLabelText('Full name'), 'Raja');
    await ue.type(screen.getByLabelText('Email'), 'raja@example.com');
    await ue.type(screen.getByLabelText('Password'), 'short');
    await ue.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Password must be at least 10 characters')).toBeInTheDocument();
  });

  it('shows a field error for a duplicate email (409)', async () => {
    server.use(http.post('*/api/v1/auth/register', () => error(409, 'CONFLICT', 'Email is already registered')));
    const ue = userEvent.setup();
    renderApp('/register', { status: 'anonymous' });

    await ue.type(screen.getByLabelText('Full name'), 'Raja');
    await ue.type(screen.getByLabelText('Email'), 'raja@example.com');
    await ue.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await ue.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('route guards', () => {
  it('redirects anonymous users to /login and returns them to the page they wanted', async () => {
    server.use(http.post('*/api/v1/auth/login', () => session()));
    const ue = userEvent.setup();
    renderApp('/responses', { status: 'anonymous' });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();

    await ue.type(screen.getByLabelText('Email'), 'raja@example.com');
    await ue.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await ue.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Responses' })).toBeInTheDocument();
  });

  it('ignores a malicious ?next= and goes to /forms', async () => {
    renderApp('/login?next=//evil.com', AUTHENTICATED);
    expect(await screen.findByRole('heading', { level: 1, name: 'Forms' })).toBeInTheDocument();
  });

  it('shows a loading screen while bootstrapping', () => {
    renderApp('/forms', { status: 'bootstrapping' });
    expect(screen.getByRole('status')).toHaveTextContent('Loading your workspace');
  });

  it('shows a retry screen when bootstrap failed, and recovers after Try again', async () => {
    server.use(http.post('*/api/v1/auth/refresh', () => session()));
    const ue = userEvent.setup();
    renderApp('/forms', { status: 'error' });

    expect(screen.getByRole('alert')).toHaveTextContent('Can’t reach the server');
    await ue.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Forms' })).toBeInTheDocument();
  });
});

describe('logout', () => {
  it('signs out and returns to the login page', async () => {
    server.use(http.post('*/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })));
    const ue = userEvent.setup();
    renderApp('/forms', AUTHENTICATED);

    await ue.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('bootstrapSession', () => {
  it('authenticates when the refresh cookie is valid', async () => {
    server.use(http.post('*/api/v1/auth/refresh', () => session()));
    const { store } = renderApp('/login', { status: 'bootstrapping' });

    await bootstrapSession(store.dispatch);

    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().auth.accessToken).toBe('tok');
  });

  it('becomes anonymous on 401', async () => {
    server.use(http.post('*/api/v1/auth/refresh', () => error(401, 'UNAUTHORIZED', 'Invalid session')));
    const { store } = renderApp('/login', { status: 'bootstrapping' });

    await bootstrapSession(store.dispatch);

    expect(store.getState().auth.status).toBe('anonymous');
  });

  it('becomes "error" (not logged out) on a server failure', async () => {
    server.use(http.post('*/api/v1/auth/refresh', () => new HttpResponse('upstream down', { status: 502 })));
    const { store } = renderApp('/login', { status: 'bootstrapping' });

    await bootstrapSession(store.dispatch);

    expect(store.getState().auth.status).toBe('error');
  });
});