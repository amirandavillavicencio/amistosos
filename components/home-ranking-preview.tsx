import Link from 'next/link';
import type { ClubStatsCard } from '@/lib/types';

interface HomeRankingPreviewProps {
  teams: ClubStatsCard[];
}

export default function HomeRankingPreview({ teams }: HomeRankingPreviewProps) {
  return (
    <section className="card-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Ranking ELO</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Top 5 equipos</h2>
        </div>
        <Link href="/ranking" className="text-sm font-medium text-accent hover:underline">
          Ver ranking completo
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          Aún no hay equipos rankeados. Registra resultados para iniciar la tabla.
        </div>
      ) : (
        <ol className="space-y-2.5">
          {teams.map((team, index) => (
            <li key={team.id} className="flex items-center justify-between rounded-xl border border-line/70 bg-white/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-ink">#{index + 1} · {team.club_name}</p>
                <p className="text-xs text-muted">{team.matches_played} PJ · {team.wins} G · {team.losses} P</p>
              </div>
              <span className="rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                {team.win_rate}%
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
