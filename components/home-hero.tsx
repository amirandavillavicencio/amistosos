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
    <section className="rounded-[2rem] border border-[#1f58ad] bg-[#0f3b82] p-6 sm:p-8 lg:p-10">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffd447]">Amistosos Vóley</p>
          <h1 className="mt-2 font-display text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl">Encuentra rival para tu próximo amistoso</h1>
          <p className="mt-4 max-w-2xl text-base text-[#dbe8ff] sm:text-lg">
            Publica disponibilidad y revisa matches activos por comuna, categoría, rama y horario.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/publicar" className="btn-accent">Publicar equipo</Link>
            <Link href="/explorar" className="btn-secondary border-white/60 bg-white/95 text-[#0f3b82] hover:bg-white">
              Explorar equipos
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric label="Equipos activos" value={formatPlural(postCount, 'equipo', 'equipos')} />
          <Metric label="Matches disponibles" value={formatPlural(suggestedCount, 'match', 'matches')} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d0e0fb] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#21529f]">{label}</p>
      <p className="mt-1 font-display text-4xl leading-none text-[#0f2f6a]">{value}</p>
    </div>
  );
}
