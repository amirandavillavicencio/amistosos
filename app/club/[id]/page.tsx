import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HISTORY_MINIMUM, getTeamProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ClubProfilePage({ params }: { params: { id: string } }) {
  const profile = await getTeamProfile(params.id);
  if (!profile) return notFound();

  return (
    <main className="section">
      <Link href="/ranking" className="text-sm text-accent">
        ← Volver al ranking
      </Link>

      <section className="mt-4 rounded-3xl border border-white/10 bg-panel/70 p-6">
        <p className="text-sm text-slate-400">Resumen del equipo</p>
        <h1 className="mt-1 text-4xl font-bold">{profile.club_name}</h1>
        <p className="mt-2 text-slate-300">
          {profile.comuna}, {profile.city} · {profile.branch} · Nivel declarado {profile.declared_level}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Puntaje actual" value={String(profile.current_elo)} />
          <Stat label="Partidos" value={String(profile.matches_played)} />
          <Stat label="Victorias" value={String(profile.wins)} />
          <Stat label="Derrotas" value={String(profile.losses)} />
          <Stat label="Win rate" value={`${profile.win_rate}%`} />
        </div>
        <p className="mt-4 text-sm text-slate-400">
          {profile.matches_played < HISTORY_MINIMUM
            ? 'Equipo con pocos resultados cargados todavía.'
            : 'Resultados actualizados según los partidos registrados.'}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Últimos resultados</h2>
        <div className="mt-4 grid gap-3">
          {profile.latest_results.slice(0, 10).map((result) => (
            <article key={result.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">
                  {result.sets_won > result.sets_lost ? '✅ Victoria' : result.sets_won < result.sets_lost ? '❌ Derrota' : '➖ Empate'} · {result.sets_won}-{result.sets_lost}
                </p>
                <p className="text-sm text-slate-400">{result.match_date}</p>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Rival: {result.opponent_name || 'Club en plataforma'} · {result.match_type}
              </p>
              {result.set_scores && <p className="mt-1 text-xs text-slate-400">Sets: {result.set_scores}</p>}
            </article>
          ))}
          {profile.latest_results.length === 0 && (
            <p className="text-slate-400">Aún no hay resultados registrados para este equipo.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
