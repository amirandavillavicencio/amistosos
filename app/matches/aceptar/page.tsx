import Link from 'next/link';
import AcceptMatchForm from '@/components/accept-match-form';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AvailabilityWithTeam } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface AcceptMatchPageProps {
  searchParams?: {
    matchId?: string;
    postA?: string;
    postB?: string;
  };
}

interface InitialUnlockedContact {
  clubName: string;
  comuna: string;
  hasCourt: boolean;
  contactEmail: string;
  notes: string | null;
}

function safeText(value: string | null | undefined, fallback: string): string {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function MatchErrorState({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="section py-10">
      <article className="card-panel p-6 text-center">
        <h1 className="display-serif text-2xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Link href="/" className="btn-secondary mt-4 inline-flex">Volver al inicio</Link>
      </article>
    </main>
  );
}

export default async function AcceptMatchPage({ searchParams }: AcceptMatchPageProps) {
  const resolved = searchParams || {};
  const matchId = String(resolved.matchId || '').trim();

  console.log('[matches/aceptar] searchParams:', resolved);
  console.log('[matches/aceptar] matchId:', matchId || '(missing)');

  if (!matchId) {
    return (
      <MatchErrorState
        title="Falta información del match"
        message="No se recibió el identificador del match."
      />
    );
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('suggested_matches')
    .select('id,post_a_id,post_b_id,status')
    .eq('id', matchId)
    .maybeSingle<{ id: string; post_a_id: string; post_b_id: string; status: string }>();

  const suggestedMatch = data || null;
  console.log('[matches/aceptar] match found:', suggestedMatch);
  console.log('[matches/aceptar] match status:', suggestedMatch?.status ?? '(not found)');

  if (!suggestedMatch) {
    return (
      <MatchErrorState
        title="Match no encontrado"
        message="No existe un match con el identificador recibido."
      />
    );
  }

  if (suggestedMatch.status !== 'active' && suggestedMatch.status !== 'archived') {
    return (
      <MatchErrorState
        title="Match no disponible"
        message="El match existe, pero ya no está disponible para ver el contacto."
      />
    );
  }

  const { data: posts, error } = await supabase
    .from('availabilities')
    .select('*')
    .in('id', [suggestedMatch.post_a_id, suggestedMatch.post_b_id])
    .returns<AvailabilityWithTeam[]>();

  if (error || !posts || posts.length !== 2) {
    return (
      <main className="section py-10">
        <article className="card-panel p-6 text-center">
          <h1 className="display-serif text-2xl text-ink">No pudimos cargar el match</h1>
          <p className="mt-2 text-sm text-muted">Puede que la disponibilidad ya no esté activa o haya sido editada.</p>
          <Link href="/" className="btn-secondary mt-4 inline-flex">Volver al inicio</Link>
        </article>
      </main>
    );
  }

  const byId = new Map(posts.map((post) => [post.id, post]));
  const teamA = byId.get(suggestedMatch.post_a_id) || posts[0];
  const teamB = byId.get(suggestedMatch.post_b_id) || posts[1];
  const teamAName = safeText(teamA.club_name, 'Equipo A');
  const teamBName = safeText(teamB.club_name, 'Equipo B');
  const initialUnlockedContact: InitialUnlockedContact | null = suggestedMatch.status === 'archived'
    ? {
      clubName: safeText(teamB.club_name, 'Club rival'),
      comuna: safeText(teamB.comuna, 'Comuna no informada'),
      hasCourt: Boolean(teamB.has_court),
      contactEmail: safeText(teamB.contact_email, 'Sin correo disponible'),
      notes: safeText(teamB.notes, '') || null
    }
    : null;

  return (
    <main className="section py-8 sm:py-10">
      <article className="card-panel mx-auto max-w-3xl p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Contacto de amistoso</p>
        <h1 className="mt-1 display-serif text-3xl text-ink">Hacer match con el equipo rival</h1>
        <p className="mt-2 text-sm text-muted">
          {suggestedMatch.status === 'archived'
            ? 'Este match ya fue realizado. Te mostramos el contacto desbloqueado.'
            : 'Pon un correo de uno de los equipos para ver el contacto del rival.'}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line/80 bg-paper/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Equipo A</p>
            <p className="mt-1 text-lg font-semibold text-ink">{teamAName}</p>
            <p className="text-sm text-muted">{safeText(teamA.comuna, 'Comuna no informada')}</p>
          </div>
          <div className="rounded-xl border border-line/80 bg-paper/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Equipo B</p>
            <p className="mt-1 text-lg font-semibold text-ink">{teamBName}</p>
            <p className="text-sm text-muted">{safeText(teamB.comuna, 'Comuna no informada')}</p>
          </div>
        </div>

        <AcceptMatchForm
          matchId={suggestedMatch.id}
          initialMatchStatus={suggestedMatch.status === 'archived' ? 'archived' : 'active'}
          initialContact={initialUnlockedContact}
        />

        <div className="pt-2">
          <Link href="/" className="btn-secondary">Cancelar</Link>
        </div>
      </article>
    </main>
  );
}
