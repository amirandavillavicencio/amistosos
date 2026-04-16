import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EmptyState, SectionShell, StatusBadge } from '@/components/ui-shell';
import { HISTORY_MINIMUM, getTeamProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ClubProfilePage({ params }: { params: { id: string } }) {
  const profile = await getTeamProfile(params.id);
  if (!profile) return notFound();

  return (
    <main className="section">
      <Link href="/ranking" className="editorial-link">← Volver al ranking</Link>

      <SectionShell className="mt-4">
        <p className="app-eyebrow">Resumen del equipo</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{profile.club_name}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {profile.comuna}, {profile.city} · {profile.branch} · Nivel declarado {profile.declared_level}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Puntaje actual" value={String(profile.current_elo)} />
          <Stat label="Partidos" value={String(profile.matches_played)} />
          <Stat label="Victorias" value={String(profile.wins)} />
          <Stat label="Derrotas" value={String(profile.losses)} />
          <Stat label="Win rate" value={`${profile.win_rate}%`} />
        </div>
        <p className="mt-4 text-sm text-slate-300">
          {profile.matches_played < HISTORY_MINIMUM
            ? 'Equipo con pocos resultados cargados todavía.'
            : 'Resultados actualizados según los partidos registrados.'}
        </p>
      </SectionShell>

      <section className="mt-6">
        <h2 className="text-xl font-bold text-white sm:text-2xl">Últimos resultados</h2>
        <div className="mt-4 grid gap-3">
          {profile.latest_results.slice(0, 10).map((result) => (
            <SectionShell key={result.id} className="rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge tone={result.sets_won > result.sets_lost ? 'success' : result.sets_won < result.sets_lost ? 'danger' : 'warning'}>
                  {result.sets_won > result.sets_lost ? 'Victoria' : result.sets_won < result.sets_lost ? 'Derrota' : 'Empate'}
                </StatusBadge>
                <p className="text-xs text-slate-400">{result.match_date}</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">Rival: {result.opponent_name || 'Club en plataforma'} · {result.match_type}</p>
              <p className="mt-1 text-lg font-black text-white">{result.sets_won}-{result.sets_lost}</p>
              {result.set_scores && <p className="mt-1 text-xs text-slate-400">Sets: {result.set_scores}</p>}
            </SectionShell>
          ))}
          {profile.latest_results.length === 0 && (
            <EmptyState title="Aún no hay resultados" description="Este equipo todavía no registra partidos en la plataforma." />
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
