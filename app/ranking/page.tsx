import Link from 'next/link';
import BackHomeLink from '@/components/back-home-link';
import TeamRankingCard from '@/components/team-ranking-card';
import { EmptyState, PageHeader, SectionShell } from '@/components/ui-shell';
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

  const topThree = teams.slice(0, 3);

  return (
    <main className="section">
      <PageHeader
        eyebrow="Ranking de equipos"
        title="Ranking ELO"
        description="Se actualiza con resultados válidos. Si ganas ante rivales fuertes, subes más puntos."
        action={<BackHomeLink />}
      />

      {topThree.length > 0 ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {topThree.map((team, index) => (
            <SectionShell key={team.id} className={index === 0 ? 'border-yellow-300/35 bg-yellow-500/10' : ''}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Top {index + 1}</p>
              <p className="mt-2 text-lg font-bold text-white">{team.club_name}</p>
              <p className="text-sm text-slate-300">{team.wins} G · {team.losses} P · {team.matches_played} PJ</p>
            </SectionShell>
          ))}
        </div>
      ) : null}

      {teams.length === 0 ? (
        <EmptyState
          title="Todavía no hay ranking"
          description="Sube un resultado válido para iniciar la tabla de posiciones."
          action={<Link href="/resultados" className="btn-accent">Registrar primer resultado</Link>}
        />
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
