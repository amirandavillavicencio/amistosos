import type { ClubStatsCard } from '@/lib/types';

export default function TeamRankingCard({ team, position }: { team: ClubStatsCard; position?: number }) {
  return (
    <article className="card-panel p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{position ? `#${position}` : 'Equipo'}</p>
          <h3 className="display-serif text-2xl font-semibold text-ink">{team.club_name}</h3>
          {team.comuna && <p className="text-sm text-muted">{team.comuna}</p>}
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent">{team.win_rate}%</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl border border-line bg-sand/40 p-2">
          <p className="text-muted">Partidos</p>
          <p className="font-semibold text-ink">{team.matches_played}</p>
        </div>
        <div className="rounded-xl border border-line bg-sand/40 p-2">
          <p className="text-muted">Victorias</p>
          <p className="font-semibold text-ink">{team.wins}</p>
        </div>
        <div className="rounded-xl border border-line bg-sand/40 p-2">
          <p className="text-muted">Derrotas</p>
          <p className="font-semibold text-ink">{team.losses}</p>
        </div>
      </div>
    </article>
  );
}
