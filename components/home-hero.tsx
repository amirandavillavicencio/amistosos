import Link from 'next/link';
import { formatPlural } from '@/lib/format';

export default function HomeHero({
  suggestedCount = 0,
  postCount = 0
}: {
  suggestedCount?: number;
  postCount?: number;
}) {
  return (
    <section className="rounded-[2rem] border border-[#1d4a95] bg-[#0f3b82] p-6 sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <h1 className="font-display text-5xl leading-tight text-white sm:text-6xl">Encuentra rival para tu próximo amistoso</h1>
          <p className="mt-3 max-w-2xl text-base text-[#dbe8ff]">
            Publica cuándo puede jugar tu equipo y revisa cruces con otros equipos disponibles.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/publicar" className="btn-accent">
              Publicar equipo
            </Link>
            <Link href="/explorar" className="btn-secondary">
              Ver equipos
            </Link>
          </div>
        </div>

        <div className="grid min-w-[230px] grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <Metric label="Equipos activos" value={formatPlural(postCount, 'equipo', 'equipos')} />
          <Metric label="Cruces disponibles" value={formatPlural(suggestedCount, 'cruce', 'cruces')} />
          <Metric label="Beta" value="Sí" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f3cb2c] bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#21529f]">{label}</p>
      <p className="mt-1 font-display text-3xl text-[#0f2f6a]">{value}</p>
    </div>
  );
}
