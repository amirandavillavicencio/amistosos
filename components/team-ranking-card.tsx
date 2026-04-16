import Link from 'next/link';
import type { ClubStatsCard } from '@/lib/types';

export default function TeamRankingCard({ team, position }: { team: ClubStatsCard; position?: number }) {
  return (
    <article className="app-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{position ? `#${position}` : 'Equipo'}</p>
          <h3 className="break-words text-xl font-bold text-white sm:text-2xl">{team.club_name}</h3>
          {team.comuna && <p className="text-sm text-slate-300">{team.comuna}</p>}
        </div>
        <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-3 py-1 text-sm font-semibold text-fuchsia-100">{team.win_rate}% WR</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-2">
          <p className="text-slate-400">Partidos</p>
          <p className="font-semibold text-white">{team.matches_played}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-2">
          <p className="text-slate-400">Victorias</p>
          <p className="font-semibold text-white">{team.wins}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-2">
          <p className="text-slate-400">Derrotas</p>
          <p className="font-semibold text-white">{team.losses}</p>
        </div>
      </div>
      <Link href={`/club/${team.id}`} className="mt-4 inline-flex text-sm font-semibold text-fuchsia-200 hover:text-fuchsia-100">
        Ver perfil del equipo
      </Link>
    </article>
  );
}
