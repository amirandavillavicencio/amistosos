import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;
const store = new Map<string, number[]>();

function hitLimit(key: string) {
  const now = Date.now();
  const bucket = store.get(key) || [];
  const recent = bucket.filter((ts) => now - ts < WINDOW_MS);

  if (recent.length >= LIMIT) {
    store.set(key, recent);
    return true;
  }

  recent.push(now);
  store.set(key, recent);
  return false;
}

export function middleware(request: NextRequest) {
  if (request.method !== 'POST') return NextResponse.next();

  const hasServerActionHeader = request.headers.has('next-action');
  if (!hasServerActionHeader) return NextResponse.next();

  const path = request.nextUrl.pathname;
  if (!['/', '/publicar', '/resultados'].includes(path)) return NextResponse.next();

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const key = `${path}:${ip}`;

  if (hitLimit(key)) {
    return NextResponse.json({ error: 'Rate limit excedido. Máximo 5 envíos por hora.' }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/publicar', '/resultados']
};
