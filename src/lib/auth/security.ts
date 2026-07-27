import { createHmac, timingSafeEqual } from 'node:crypto';

export function secureStringEqual(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function verifyPassword(
  password: unknown,
  expectedPassword = process.env.AUTH_PASSWORD,
) {
  return secureStringEqual(password, expectedPassword);
}

export function hasValidBearerToken(
  request: Request,
  expectedPassword = process.env.AUTH_PASSWORD,
) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;
  return secureStringEqual(header.slice(7), expectedPassword);
}

export function createLoginAttemptKey(
  forwardedFor: string | null,
  secret: string,
) {
  const clientAddress =
    forwardedFor?.split(',')[0]?.trim().slice(0, 128) || 'unknown';
  return createHmac('sha256', secret).update(clientAddress).digest('base64url');
}
