import Link from "next/link";
import type { MatchResultRow } from "@/lib/types";

interface HomeResultsPreviewProps {
  results: MatchResultRow[];
}

function getResultLabel(result: MatchResultRow): string {
  if (result.sets_won > result.sets_lost) return "Victoria";
  if (result.sets_won < result.sets_lost) return "Derrota";
  return "Empate";
}

function resultTone(result: MatchResultRow): string {
  if (result.sets_won > result.sets_lost)
    return "border-emerald-300/40 bg-emerald-500/12";
  if (result.sets_won < result.sets_lost)
    return "border-rose-300/40 bg-rose-500/12";
  return "border-amber-300/40 bg-amber-500/12";
}

export default function HomeResultsPreview({
  results,
}: HomeResultsPreviewProps) {
  return (
    <section className="rounded-3xl border border-slate-700/75 bg-slate-900/85 p-4 shadow-[0_20px_52px_rgba(2,6,23,0.5)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-orange-200">
            Resultados
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">
            Últimos cargados
          </h2>
        </div>
        <Link
          href="/resultados"
          className="text-sm font-semibold text-orange-200 hover:text-orange-100"
        >
          Registrar resultado
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-600 p-4 text-sm text-slate-300">
          Todavía no hay resultados recientes. Sé el primero en registrar uno.
        </div>
      ) : (
        <div className="space-y-2.5">
          {results.map((result) => (
            <article
              key={result.id}
              className={`rounded-xl border px-3 py-2.5 ${resultTone(result)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-white">
                  {getResultLabel(result)}
                </p>
                <p className="text-xs text-slate-300">{result.match_date}</p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-200">
                  Rival: {result.opponent_name || "Club registrado"} ·{" "}
                  {result.match_type}
                </p>
                <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-sm font-black text-white">
                  {result.sets_won} - {result.sets_lost}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
