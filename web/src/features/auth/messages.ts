import { ApiError } from '../../api/errors';

export function describeAuthError(err: unknown, context: 'login' | 'register'): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    if (err.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (err.status === 401 && context === 'login') return 'Invalid email or password.';
    if (err.status >= 500) return 'The server had a problem. Please try again in a moment.';
  }
  return 'Something went wrong. Please try again.';
}