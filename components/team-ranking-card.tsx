import type { ClubStatsCard } from '@/lib/types';

export default function TeamRankingCard({ team, position }: { team: ClubStatsCard; position?: number }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-panel/70 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{position ? `#${position}` : 'Equipo'}</p>
          <h3 className="text-xl font-semibold">{team.club_name}</h3>
          {team.comuna && <p className="text-sm text-slate-400">{team.comuna}</p>}
        </div>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-sm text-accent">{team.win_rate}%</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl border border-white/10 p-2">
          <p className="text-slate-400">Partidos</p>
          <p className="font-semibold">{team.matches_played}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-2">
          <p className="text-slate-400">Victorias</p>
          <p className="font-semibold">{team.wins}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-2">
          <p className="text-slate-400">Derrotas</p>
          <p className="font-semibold">{team.losses}</p>
        </div>
      </div>
    </article>
  );
}
