import Link from 'next/link';
import type { MatchResultRow } from '@/lib/types';

interface HomeResultsPreviewProps {
  results: MatchResultRow[];
}

function getResultLabel(result: MatchResultRow): string {
  if (result.sets_won > result.sets_lost) return 'Victoria';
  if (result.sets_won < result.sets_lost) return 'Derrota';
  return 'Empate';
}

function resultTone(result: MatchResultRow): string {
  if (result.sets_won > result.sets_lost) return 'border-emerald-300/40 bg-emerald-500/12';
  if (result.sets_won < result.sets_lost) return 'border-rose-300/40 bg-rose-500/12';
  return 'border-amber-300/40 bg-amber-500/12';
}

export default function HomeResultsPreview({ results }: HomeResultsPreviewProps) {
  if (!Array.isArray(results) || results.length === 0) return null;

  return (
    <section className="app-card p-4 sm:p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="app-eyebrow">Últimos partidos</p>
          <h2 className="mt-1 text-xl font-black text-white">Resultados</h2>
        </div>
        <Link href="/resultados" className="btn-secondary !px-4 !py-2 text-xs sm:text-sm">
          Cargar resultado
        </Link>
      </div>
      <div className="space-y-3">
        {results.map((result) => (
          <article key={result.id} className={`rounded-2xl border px-3.5 py-3 ${resultTone(result)}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">{getResultLabel(result)}</p>
              <p className="text-xs text-slate-300">{result.match_date}</p>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-200">{result.opponent_name || 'Club registrado'}</p>
              <span className="whitespace-nowrap rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-sm font-black text-white">
                {result.sets_won} - {result.sets_lost}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
