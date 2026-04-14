import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'amistosos_admin_session';
const DEFAULT_ADMIN_USERNAME = 'admin';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

interface AdminSessionPayload {
  u: string;
  iat: number;
  exp: number;
}

export interface AdminSession {
  username: string;
  issuedAt: number;
  expiresAt: number;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function normalizeHash(hash: string): string {
  return hash.trim().toLowerCase().replace(/^sha256[:$]/, '');
}

function getSessionSecret(): string {
  const value = String(process.env.ADMIN_SESSION_SECRET || '').trim();
  if (!value) {
    throw new Error('Missing required env var: ADMIN_SESSION_SECRET');
  }
  return value;
}

function getAdminPasswordHash(): string {
  const value = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
  if (!value) {
    throw new Error('Missing required env var: ADMIN_PASSWORD_HASH');
  }
  return normalizeHash(value);
}

export function getAdminUsername(): string {
  const value = String(process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
  return value || DEFAULT_ADMIN_USERNAME;
}

export function hashPasswordSha256(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function signPayload(payloadB64: string): string {
  return createHmac('sha256', getSessionSecret()).update(payloadB64).digest('base64url');
}

function createToken(payload: AdminSessionPayload): string {
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

function parseToken(token: string): AdminSessionPayload | null {
  const clean = String(token || '').trim();
  if (!clean) return null;

  const [payloadB64, signature] = clean.split('.');
  if (!payloadB64 || !signature) return null;

  const expected = signPayload(payloadB64);
  if (!safeEqualString(signature, expected)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payloadB64)) as Partial<AdminSessionPayload>;
    if (!parsed || typeof parsed.u !== 'string' || typeof parsed.iat !== 'number' || typeof parsed.exp !== 'number') {
      return null;
    }
    return { u: parsed.u, iat: parsed.iat, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function verifyAdminCredentials(input: { username: string; password: string }): boolean {
  const expectedUser = getAdminUsername();
  const expectedHash = getAdminPasswordHash();

  const username = String(input.username || '').trim().toLowerCase();
  const passwordHash = hashPasswordSha256(String(input.password || ''));

  return safeEqualString(username, expectedUser) && safeEqualString(normalizeHash(passwordHash), expectedHash);
}

export async function createAdminSession(username: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    u: String(username || '').trim().toLowerCase(),
    iat: now,
    exp: now + SESSION_TTL_SECONDS
  };
  const token = createToken(payload);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || '';
  const parsed = parseToken(raw);
  if (!parsed) return null;

  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp <= now) return null;

  return {
    username: parsed.u,
    issuedAt: parsed.iat,
    expiresAt: parsed.exp
  };
}
