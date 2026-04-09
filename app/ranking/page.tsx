import Link from 'next/link';
import TeamRankingCard from '@/components/team-ranking-card';
import { getTopTeams } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const teams = await getTopTeams(40);
  const mostActive = [...teams].sort((a, b) => b.matches_played - a.matches_played).slice(0, 3);

  return (
    <main className="section">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-accent">Ranking general</p>
          <h1 className="text-4xl font-bold">Equipos por ELO</h1>
          <p className="mt-2 text-slate-400">ELO basado en partidos registrados. Equipos nuevos muestran estado inicial.</p>
        </div>
        <Link href="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm">
          Ir al inicio
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {mostActive.map((team) => (
          <article key={team.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Más activo</p>
            <p className="mt-2 font-semibold">{team.club_name}</p>
            <p className="text-sm text-slate-400">{team.matches_played} partidos registrados</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {teams.map((team, index) => (
          <TeamRankingCard key={team.id} team={team} position={index + 1} />
        ))}
      </div>
    </main>
  );
}
