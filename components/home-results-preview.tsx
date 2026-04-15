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

export default function HomeResultsPreview({ results }: HomeResultsPreviewProps) {
  return (
    <section className="card-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Resultados</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Últimos cargados</h2>
        </div>
        <Link href="/resultados" className="text-sm font-medium text-accent hover:underline">
          Registrar resultado
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          Todavía no hay resultados recientes. Sé el primero en registrar uno.
        </div>
      ) : (
        <div className="space-y-2.5">
          {results.map((result) => (
            <article key={result.id} className="rounded-xl border border-line/70 bg-white/60 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{getResultLabel(result)} · {result.sets_won}-{result.sets_lost}</p>
                <p className="text-xs text-muted">{result.match_date}</p>
              </div>
              <p className="mt-1 text-xs text-muted">Rival: {result.opponent_name || 'Club registrado'} · {result.match_type}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
