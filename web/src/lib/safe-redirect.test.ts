import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './safe-redirect';

describe('safeRedirectPath', () => {
  it('allows normal same-site paths', () => {
    expect(safeRedirectPath('/forms')).toBe('/forms');
    expect(safeRedirectPath('/forms?x=1#top')).toBe('/forms?x=1#top');
    expect(safeRedirectPath('/responses')).toBe('/responses');
  });

  it('falls back for empty values', () => {
    expect(safeRedirectPath(null)).toBe('/forms');
    expect(safeRedirectPath(undefined)).toBe('/forms');
    expect(safeRedirectPath('')).toBe('/forms');
  });

  it.each([
    '//evil.com',
    '///evil.com',
    '/\\evil.com',
    '/foo\\bar',
    'https://evil.com',
    'javascript:alert(1)',
    'evil.com',
    '/foo\nbar',
    '/%0d%0a',
    '/..//evil.com',
  ])('rejects %j', (target) => {
    const result = safeRedirectPath(target);
    expect(result.startsWith('//')).toBe(false);
    expect(result).toBe(target === '/%0d%0a' ? '/%0d%0a' : '/forms');
  });

  it('uses a custom fallback', () => {
    expect(safeRedirectPath('//evil.com', '/dashboard')).toBe('/dashboard');
  });
});