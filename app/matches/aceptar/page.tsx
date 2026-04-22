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

function TeamVersusCard({
  label,
  team,
  fallbackName
}: {
  label: string;
  team: AvailabilityWithTeam;
  fallbackName: string;
}) {
  const teamName = safeText(team.club_name, fallbackName);
  const comuna = safeText(team.comuna, 'Comuna no informada');
  const instagram = safeText(team.instagram, 'Sin Instagram');
  const category = [safeText(team.branch, ''), safeText(team.age_category, '')].filter(Boolean).join(' · ');
  const level = safeText(team.level, 'Sin nivel declarado');

  return (
    <article className="relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden rounded-3xl border border-line/80 bg-paper/80 p-6 shadow-xl shadow-black/25 sm:min-h-[390px] sm:p-8">
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/15 blur-2xl" aria-hidden="true" />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent/90">{label}</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line/80 bg-paper text-xl font-black text-accent sm:h-20 sm:w-20 sm:text-2xl">
            {teamName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">{teamName}</h2>
            <p className="mt-1 text-base text-muted">{comuna}</p>
          </div>
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-ink sm:text-[15px]">
        <li className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-paper/60 px-3 py-2.5">
          <span className="text-muted">Nivel</span>
          <span className="font-semibold">{level}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-paper/60 px-3 py-2.5">
          <span className="text-muted">Rama / categoría</span>
          <span className="max-w-[65%] truncate text-right font-semibold">{category || 'Sin categoría'}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-paper/60 px-3 py-2.5">
          <span className="text-muted">Cancha</span>
          <span className="font-semibold">{team.has_court ? 'Sí tiene' : 'No confirmada'}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-paper/60 px-3 py-2.5">
          <span className="text-muted">Instagram</span>
          <span className="max-w-[65%] truncate text-right font-semibold">{instagram}</span>
        </li>
      </ul>
    </article>
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

  if (suggestedMatch.status !== 'active' && suggestedMatch.status !== 'matched') {
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
  const initialUnlockedContact: InitialUnlockedContact | null = suggestedMatch.status === 'matched'
    ? {
      clubName: safeText(teamB.club_name, 'Club rival'),
      comuna: safeText(teamB.comuna, 'Comuna no informada'),
      hasCourt: Boolean(teamB.has_court),
      contactEmail: safeText(teamB.contact_email, 'Sin correo disponible'),
      notes: safeText(teamB.notes, '') || null
    }
    : null;

  return (
    <main className="section py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-line/80 bg-panel px-4 py-6 shadow-2xl shadow-black/30 sm:px-8 sm:py-10 lg:px-10">
          <div className="absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="absolute -right-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

          <div className="relative z-10">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-accent">Amistoso coordinable</p>
            <h1 className="mt-3 text-center display-serif text-4xl text-ink sm:text-5xl lg:text-6xl">
              {safeText(teamA.club_name, 'Equipo A')} <span className="text-accent">VS</span> {safeText(teamB.club_name, 'Equipo B')}
            </h1>

            <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-7">
              <TeamVersusCard label="Equipo A" team={teamA} fallbackName="Equipo A" />

              <div className="flex items-center justify-center py-1 lg:px-1">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-accent/70 bg-accent/20 text-3xl font-black tracking-[0.2em] text-accent shadow-2xl shadow-accent/30 sm:h-28 sm:w-28 sm:text-4xl">
                  VS
                </div>
              </div>

              <TeamVersusCard label="Equipo B" team={teamB} fallbackName="Equipo B" />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-line/80 bg-paper/40 p-4 sm:p-6">
          <AcceptMatchForm
            matchId={suggestedMatch.id}
            initialMatchStatus={suggestedMatch.status === 'matched' ? 'matched' : 'active'}
            initialContact={initialUnlockedContact}
          />
        </section>

        <div className="mx-auto w-full max-w-3xl">
          <Link href="/" className="btn-secondary">Cancelar</Link>
        </div>
      </div>
    </main>
  );
}
