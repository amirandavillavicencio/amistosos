import Link from 'next/link';
import type { TeamRow } from '@/lib/types';

export default function TeamRankingCard({ team, position }: { team: TeamRow; position?: number }) {
  const winRate = team.matches_played ? Math.round((team.wins / team.matches_played) * 100) : 0;
  return (
    <article className="rounded-2xl border border-white/10 bg-panel/70 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{position ? `#${position}` : 'Club'}</p>
          <h3 className="text-xl font-semibold">{team.club_name}</h3>
          <p className="text-sm text-slate-400">
            {team.comuna}, {team.city} · {team.branch}
          </p>
        </div>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-sm text-accent">ELO {team.current_elo}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl border border-white/10 p-2">
          <p className="text-slate-400">Partidos</p>
          <p className="font-semibold">{team.matches_played}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-2">
          <p className="text-slate-400">Récord</p>
          <p className="font-semibold">
            {team.wins}-{team.losses}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 p-2">
          <p className="text-slate-400">Win rate</p>
          <p className="font-semibold">{winRate}%</p>
        </div>
      </div>
      <Link className="mt-4 inline-flex text-sm text-accent hover:underline" href={`/club/${team.id}`}>
        Ver ficha competitiva
      </Link>
    </article>
  );
}
