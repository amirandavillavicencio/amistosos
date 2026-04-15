import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import SwipeActions from '@/components/swipe-actions';
import SwipeCard from '@/components/swipe-card';
import { createMatchIntent, getNextCard } from '@/lib/matching';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AvailabilityRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: {
    from?: string;
    skip?: string;
    ok?: string;
  };
};

function getSkipIds(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRedirect(fromPostId: string, skipIds: string[], ok?: string) {
  const params = new URLSearchParams();
  params.set('from', fromPostId);

  if (skipIds.length) {
    params.set('skip', Array.from(new Set(skipIds)).join(','));
  }

  if (ok) {
    params.set('ok', ok);
  }

  return `/?${params.toString()}`;
}

async function getDefaultFromPostId(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('availabilities')
    .select('id')
    .in('status', ['open', 'active', 'published'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('HomePage default from post query failed', error);
    return null;
  }

  return data?.[0]?.id ?? null;
}

export default async function HomePage({ searchParams }: PageProps) {
  const skipIds = getSkipIds(searchParams?.skip);
  const fromPostId = searchParams?.from || (await getDefaultFromPostId());

  async function passCard(formData: FormData) {
    'use server';

    const toPostId = String(formData.get('to_post_id') || '').trim();
    if (!fromPostId) {
      redirect('/');
    }

    const nextSkipIds = toPostId ? [...skipIds, toPostId] : skipIds;
    redirect(buildRedirect(fromPostId, nextSkipIds));
  }

  async function likeCard(formData: FormData) {
    'use server';

    const toPostId = String(formData.get('to_post_id') || '').trim();
    if (!fromPostId || !toPostId) {
      redirect('/');
    }

    const result = await createMatchIntent(fromPostId, toPostId);
    revalidatePath('/');

    const nextSkipIds = [...skipIds, toPostId];
    const status = result.confirmedMatch ? 'match' : 'intent';
    redirect(buildRedirect(fromPostId, nextSkipIds, status));
  }

  let card: AvailabilityRow | null = null;

  if (fromPostId) {
    try {
      card = await getNextCard(fromPostId, skipIds);
    } catch (error) {
      console.error('HomePage getNextCard failed', error);
    }
  }

  const hasFromPost = Boolean(fromPostId);
  const statusMessage =
    searchParams?.ok === 'match'
      ? '¡Match confirmado! Ambos equipos se propusieron partido.'
      : searchParams?.ok === 'intent'
        ? 'Propuesta enviada. Si el otro equipo también da ❤️, se confirma el match.'
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-6">
      <section className="w-full max-w-md space-y-4">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Amistosos Vóley</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Encuentra rival en segundos</h2>
        </header>

        {statusMessage ? (
          <div className="rounded-2xl bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-100">{statusMessage}</div>
        ) : null}

        {!hasFromPost ? (
          <article className="rounded-3xl bg-slate-100 p-8 text-center shadow-xl shadow-black/10">
            <p className="text-lg font-semibold text-slate-800">No hay publicaciones activas</p>
            <p className="mt-2 text-sm text-slate-600">Publica disponibilidad para empezar a hacer match.</p>
          </article>
        ) : (
          <>
            <SwipeCard post={card} />
            <SwipeActions postId={card?.id ?? null} onPass={passCard} onLike={likeCard} />
          </>
        )}
      </section>
    </main>
  );
}
