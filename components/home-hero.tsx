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
    <section className="rounded-[2rem] border border-[#1f58ad] bg-[#0a2a60] p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd447]">Amistosos Vóley</p>
      <h1 className="mt-2 font-display text-4xl leading-[0.95] text-white sm:text-5xl">Encuentra rival para tu próximo amistoso</h1>
      <p className="mt-3 max-w-2xl text-sm text-[#d7e6ff] sm:text-base">
        Publica disponibilidad y revisa matches por comuna, categoría, rama y horario.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Equipos activos" value={formatPlural(postCount, 'equipo', 'equipos')} />
        <Metric label="Matches disponibles" value={formatPlural(suggestedCount, 'match', 'matches')} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/publicar" className="btn-accent">Publicar equipo</Link>
        <Link href="/explorar" className="btn-secondary border-white/40 bg-white text-[#0f3b82] hover:bg-[#f4f8ff]">Explorar equipos</Link>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#2d63b8] bg-[#123a79] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ec0ff]">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none text-white">{value}</p>
    </div>
  );
}
