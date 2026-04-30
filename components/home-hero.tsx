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
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a2447] p-6 text-white shadow-[0_20px_48px_rgba(10,36,71,0.25)] sm:p-8 lg:p-9">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-36 -top-36 h-[28rem] w-[28rem] rounded-full border border-white/[0.06]" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ffd447]">
            <span className="h-0.5 w-5 rounded-full bg-[#ffd447]" />
            Temporada activa
          </p>
          <h1 className="font-display text-6xl uppercase leading-[0.86] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Encuentra <span className="text-[#ffd447]">rival</span> para tu próximo amistoso
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            Los matches aparecen cuando hay día, horario, categoría y rama compatible. Después cada equipo confirma con su código privado.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/publicar" className="rounded-xl bg-[#ffd447] px-4 py-2.5 text-sm font-bold text-[#0a2447] shadow-[0_6px_18px_rgba(255,212,71,0.32)] transition hover:bg-[#ffe06b]">
              Publicar equipo
            </Link>
            <Link href="/explorar" className="rounded-xl border border-white/15 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#0a2447] transition hover:bg-white">
              Explorar equipos
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric label="Equipos activos" value={formatPlural(postCount, 'equipo', 'equipos')} />
          <Metric label="Matches disponibles" value={formatPlural(suggestedCount, 'match', 'matches')} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const [number, ...rest] = value.split(' ');
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm transition hover:bg-white/[0.11]">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-white/50">{label}</p>
      <p className="mt-1 font-display text-5xl uppercase leading-none text-white">
        {number} <span className="font-sans text-lg font-semibold normal-case text-white/55">{rest.join(' ')}</span>
      </p>
    </div>
  );
}
