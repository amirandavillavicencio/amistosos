import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
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

export interface AdminEnvStatus {
  hasUsername: boolean;
  hasPassword: boolean;
  hasSessionSecret: boolean;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function getAdminEnvStatus(): AdminEnvStatus {
  return {
    hasUsername: Boolean(String(process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim()),
    hasPassword: Boolean(String(process.env.ADMIN_PASSWORD || '')),
    hasSessionSecret: Boolean(String(process.env.ADMIN_SESSION_SECRET || '').trim())
  };
}

export function isAdminEnvConfigured(): boolean {
  const status = getAdminEnvStatus();
  return status.hasUsername && status.hasPassword && status.hasSessionSecret;
}

function logAdminEnvDebug(context: string) {
  console.log('ADMIN_ENV_DEBUG', {
    context,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'OK' : 'MISSING',
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ? 'OK' : 'MISSING'
  });
}

function getSessionSecret(): string {
  const value = String(process.env.ADMIN_SESSION_SECRET || '').trim();
  if (!value) {
    throw new Error('Missing required env var: ADMIN_SESSION_SECRET');
  }
  return value;
}

function getAdminPassword(): string {
  const value = String(process.env.ADMIN_PASSWORD || '');
  if (!value) {
    throw new Error('Missing required env var: ADMIN_PASSWORD');
  }
  return value;
}

export function getAdminUsername(): string {
  const value = String(process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
  return value || DEFAULT_ADMIN_USERNAME;
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

function parseToken(token: string): { payload: AdminSessionPayload | null; reason: string } {
  const clean = String(token || '').trim();
  if (!clean) {
    return { payload: null, reason: 'cookie_missing' };
  }

  const [payloadB64, signature] = clean.split('.');
  if (!payloadB64 || !signature) {
    return { payload: null, reason: 'token_malformed' };
  }

  let expected = '';

  try {
    expected = signPayload(payloadB64);
  } catch (error) {
    logAdminEnvDebug('parse_token');
    console.error('ADMIN_SESSION_MISSING', {
      reason: 'session_secret_unavailable',
      error: error instanceof Error ? error.message : String(error)
    });
    return { payload: null, reason: 'session_secret_unavailable' };
  }

  if (!safeEqualString(signature, expected)) {
    return { payload: null, reason: 'signature_mismatch' };
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadB64)) as Partial<AdminSessionPayload>;
    if (!parsed || typeof parsed.u !== 'string' || typeof parsed.iat !== 'number' || typeof parsed.exp !== 'number') {
      return { payload: null, reason: 'payload_invalid' };
    }
    return { payload: { u: parsed.u, iat: parsed.iat, exp: parsed.exp }, reason: 'ok' };
  } catch {
    return { payload: null, reason: 'payload_parse_failed' };
  }
}

export function verifyAdminCredentials(input: { username: string; password: string }): boolean {
  const expectedUser = getAdminUsername();
  const expectedPassword = getAdminPassword();

  const username = String(input.username || '').trim().toLowerCase();
  const password = String(input.password || '');

  return safeEqualString(username, expectedUser) && safeEqualString(password, expectedPassword);
}

export async function createAdminSession(username: string): Promise<void> {
  logAdminEnvDebug('create_session');

  const normalizedUsername = String(username || '').trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    u: normalizedUsername,
    iat: now,
    exp: now + SESSION_TTL_SECONDS
  };
  const token = createToken(payload);

  const cookieStore = cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = cookies();
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || '';
  const tokenState = parseToken(raw);
  const parsed = tokenState.payload;

  if (!parsed) {
    console.log('ADMIN_SESSION_MISSING', {
      reason: tokenState.reason,
      cookiePresent: Boolean(raw)
    });
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp <= now) {
    console.log('ADMIN_SESSION_MISSING', {
      reason: 'session_expired',
      username: parsed.u,
      expiresAt: parsed.exp,
      now
    });
    return null;
  }

  console.log('ADMIN_SESSION_FOUND', {
    username: parsed.u,
    issuedAt: parsed.iat,
    expiresAt: parsed.exp
  });

  return {
    username: parsed.u,
    issuedAt: parsed.iat,
    expiresAt: parsed.exp
  };
}
