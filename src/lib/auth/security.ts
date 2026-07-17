import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 14;
const MAX_PASSWORD_LENGTH = 128;

function constantTimeBufferEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

function deriveScrypt(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: SCRYPT_MAX_MEMORY,
    }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must contain ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`);
  }
}

export async function hashPassword(password: string, salt = randomBytes(16)) {
  validatePassword(password);
  const derived = await deriveScrypt(password, salt);
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: unknown, encodedHash: string | undefined) {
  if (
    typeof password !== 'string'
    || password.length < MIN_PASSWORD_LENGTH
    || password.length > MAX_PASSWORD_LENGTH
    || !encodedHash
  ) return false;
  try {
    const [algorithm, n, r, p, encodedSalt, encodedKey, extra] = encodedHash.split('$');
    if (
      algorithm !== 'scrypt'
      || Number(n) !== SCRYPT_N
      || Number(r) !== SCRYPT_R
      || Number(p) !== SCRYPT_P
      || !encodedSalt
      || !encodedKey
      || extra !== undefined
    ) return false;
    const salt = Buffer.from(encodedSalt, 'base64url');
    const expected = Buffer.from(encodedKey, 'base64url');
    if (salt.length !== 16 || expected.length !== SCRYPT_KEY_LENGTH) return false;
    return constantTimeBufferEqual(await deriveScrypt(password, salt), expected);
  } catch {
    return false;
  }
}

export function hashApiToken(token: string) {
  return `sha256$${createHash('sha256').update(token).digest('base64url')}`;
}

export function generateApiToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashApiToken(token) };
}

export function verifyApiToken(token: unknown, encodedHash: string | undefined) {
  if (typeof token !== 'string' || !encodedHash?.startsWith('sha256$')) return false;
  const expected = Buffer.from(encodedHash.slice('sha256$'.length), 'base64url');
  const actual = createHash('sha256').update(token).digest();
  return expected.length === 32 && constantTimeBufferEqual(actual, expected);
}

export function hasValidBearerToken(request: Request, expectedHash = process.env.API_TOKEN_HASH) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;
  return verifyApiToken(header.slice(7), expectedHash);
}

export function createLoginAttemptKey(forwardedFor: string | null, secret: string) {
  const clientAddress = forwardedFor?.split(',')[0]?.trim().slice(0, 128) || 'unknown';
  return createHmac('sha256', secret).update(clientAddress).digest('base64url');
}
