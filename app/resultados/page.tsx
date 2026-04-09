import Link from 'next/link';
import ResultForm from '@/components/result-form';
import { getAllTeamsMinimal, getRecentResults } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ResultadosPage() {
  const [teams, recent] = await Promise.all([getAllTeamsMinimal(), getRecentResults(12)]);

  return (
    <main className="section">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-accent">Carga de historial</p>
          <h1 className="text-4xl font-bold">Registrar resultado</h1>
        </div>
        <Link href="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm">
          Volver al inicio
        </Link>
      </div>

      <ResultForm teams={teams} />

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Historial reciente</h2>
        <div className="mt-4 grid gap-3">
          {recent.map((result) => (
            <article key={result.id} className="rounded-2xl border border-white/10 bg-panel/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">
                  {result.sets_won > result.sets_lost ? 'Victoria' : result.sets_won < result.sets_lost ? 'Derrota' : 'Empate'} · {result.sets_won}-{result.sets_lost}
                </p>
                <p className="text-sm text-slate-400">{result.match_date}</p>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Rival: {result.opponent_name || 'Club registrado'} · {result.match_type}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
