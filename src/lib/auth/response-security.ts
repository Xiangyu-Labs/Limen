import { randomBytes } from 'node:crypto';

export function createRequestNonce() {
  return randomBytes(16).toString('base64');
}

export function buildContentSecurityPolicy(nonce: string, development = process.env.NODE_ENV !== 'production') {
  const scriptSources = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`];
  if (development) scriptSources.push(`'unsafe-eval'`);
  return [
    `default-src 'self'`,
    `script-src ${scriptSources.join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'${development ? ' ws: wss:' : ''}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(development ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function applySecurityHeaders(headers: Headers, contentSecurityPolicy: string, production = process.env.NODE_ENV === 'production') {
  headers.set('Content-Security-Policy', contentSecurityPolicy);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (production) headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
}
