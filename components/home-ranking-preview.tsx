import Link from "next/link";
import type { ClubStatsCard } from "@/lib/types";

interface HomeRankingPreviewProps {
  teams: ClubStatsCard[];
}

function rankStyles(index: number): string {
  if (index === 0)
    return "border-yellow-300/40 bg-yellow-500/10 text-yellow-100";
  if (index === 1) return "border-slate-300/40 bg-slate-300/10 text-slate-100";
  if (index === 2)
    return "border-orange-300/40 bg-orange-500/10 text-orange-100";
  return "border-slate-600/70 bg-slate-900/70 text-slate-100";
}

export default function HomeRankingPreview({ teams }: HomeRankingPreviewProps) {
  return (
    <section className="rounded-3xl border border-slate-700/75 bg-slate-900/85 p-4 shadow-[0_20px_52px_rgba(2,6,23,0.5)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-200">
            Ranking ELO
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">Top 5 equipos</h2>
        </div>
        <Link
          href="/ranking"
          className="text-sm font-semibold text-violet-200 hover:text-violet-100"
        >
          Ver ranking completo
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-600 p-4 text-sm text-slate-300">
          Aún no hay equipos rankeados. Registra resultados para iniciar la
          tabla.
        </div>
      ) : (
        <ol className="space-y-2.5">
          {teams.map((team, index) => (
            <li
              key={team.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${rankStyles(index)}`}
            >
              <div>
                <p className="text-sm font-bold">
                  #{index + 1} · {team.club_name}
                </p>
                <p className="text-xs text-slate-300">
                  {team.matches_played} PJ · {team.wins} G · {team.losses} P
                </p>
              </div>
              <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-2.5 py-1 text-xs font-bold text-fuchsia-100">
                {team.win_rate}% WR
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
