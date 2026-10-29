/**
 * Only allows same-site paths like "/forms?x=1". Rejects "//evil.com", "/\evil.com",
 * "https://evil.com", "javascript:..." and anything with control characters or backslashes.
 */
export function safeRedirectPath(target: string | null | undefined, fallback = '/forms'): string {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;

  for (const char of target) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127 || char === '\\') return fallback;
  }

  try {
    const url = new URL(target, 'http://localhost');
    if (url.origin !== 'http://localhost') return fallback;
    const normalized = url.pathname + url.search + url.hash;
    // "/..//evil.com" normalises to "//evil.com", which a browser would treat as another site.
    if (normalized.startsWith('//')) return fallback;
    return normalized;
  } catch {
    return fallback;
  }
}