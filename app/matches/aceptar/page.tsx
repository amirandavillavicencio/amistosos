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
    <article className="relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-line bg-paper/70 p-5 shadow-sm sm:p-6">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent/10 blur-xl" aria-hidden="true" />

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">{label}</p>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line/80 bg-paper text-lg font-black text-accent">
          {teamName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">{teamName}</h2>
          <p className="text-sm text-muted">{comuna}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-ink">
        <li className="flex items-center justify-between gap-3 rounded-lg border border-line/70 bg-paper/60 px-3 py-2">
          <span className="text-muted">Cancha</span>
          <span className="font-medium">{team.has_court ? 'Sí tiene' : 'No confirmada'}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-lg border border-line/70 bg-paper/60 px-3 py-2">
          <span className="text-muted">Instagram</span>
          <span className="max-w-[65%] truncate font-medium">{instagram}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-lg border border-line/70 bg-paper/60 px-3 py-2">
          <span className="text-muted">Categoría</span>
          <span className="max-w-[65%] truncate font-medium">{category || 'Sin categoría'}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-lg border border-line/70 bg-paper/60 px-3 py-2">
          <span className="text-muted">Nivel</span>
          <span className="font-medium">{level}</span>
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
      <article className="card-panel mx-auto max-w-5xl p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Amistoso confirmado</p>
        <h1 className="mt-2 display-serif text-3xl text-ink sm:text-4xl">{safeText(teamA.club_name, 'Equipo A')} <span className="text-accent">vs</span> {safeText(teamB.club_name, 'Equipo B')}</h1>

        <section className="mt-6">
          <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
            <TeamVersusCard label="Equipo A" team={teamA} fallbackName="Equipo A" />

            <div className="flex items-center justify-center lg:px-1">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-accent/50 bg-accent/15 text-2xl font-black tracking-widest text-accent shadow-lg shadow-accent/20">
                VS
              </div>
            </div>

            <TeamVersusCard label="Equipo B" team={teamB} fallbackName="Equipo B" />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-line/80 bg-paper/40 p-4 sm:p-6">
          <AcceptMatchForm
            matchId={suggestedMatch.id}
            initialMatchStatus={suggestedMatch.status === 'archived' ? 'archived' : 'active'}
            initialContact={initialUnlockedContact}
          />
        </section>

        <div className="pt-4">
          <Link href="/" className="btn-secondary">Cancelar</Link>
        </div>
      </article>
    </main>
  );
}
