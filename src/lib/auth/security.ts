import { createHash, timingSafeEqual } from 'node:crypto';

export function secureStringEqual(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftDigest = createHash('sha256').update(left).digest();
  const rightDigest = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function hasValidBearerToken(request: Request, expected = process.env.AUTH_PASSWORD): boolean {
  if (!expected) return false;
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;
  return secureStringEqual(header.slice(7), expected);
}
