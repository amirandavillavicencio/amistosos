import Link from 'next/link';
import TeamRankingCard from '@/components/team-ranking-card';
import { getClubStatsRanking } from '@/lib/data';
import type { ClubStatsCard } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  let teams: ClubStatsCard[] = [];
  try {
    teams = await getClubStatsRanking(40);
  } catch (error) {
    console.error('RankingPage data load failed', error);
  }

  const mostActive = [...teams].sort((a, b) => b.matches_played - a.matches_played).slice(0, 3);

  return (
    <main className="section">
      <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-accent">Ranking de equipos</p>
          <h1 className="display-serif text-4xl text-ink sm:text-5xl">Ranking ELO</h1>
          <p className="mt-2 text-muted">Se actualiza con fotos que incluyan resultado válido (por ejemplo 3-1).</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            El ranking se basa en un sistema ELO. Cada equipo tiene un puntaje que sube cuando gana y baja cuando
            pierde. Si ganas contra un equipo con más victorias, subes más puntos. Si pierdes contra uno con menos
            victorias, bajas más puntos.
          </p>
        </div>
        <Link href="/" className="rounded-xl border border-line bg-ivory px-4 py-2 text-sm text-ink">
          Ir al inicio
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {mostActive.map((team) => (
          <article key={team.id} className="card-panel p-4">
            <p className="text-xs text-muted">Equipo más activo</p>
            <p className="mt-2 display-serif text-2xl text-ink">{team.club_name}</p>
            <p className="text-sm text-muted">{team.matches_played} partidos registrados</p>
          </article>
        ))}
      </div>

      {teams.length === 0 ? (
        <p className="text-muted">Todavía no hay ranking. Sube una foto con resultado para iniciar la tabla.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((team, index) => (
            <TeamRankingCard key={team.id} team={team} position={index + 1} />
          ))}
        </div>
      )}
    </main>
  );
}
