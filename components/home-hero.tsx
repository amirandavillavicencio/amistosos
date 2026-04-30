import Link from 'next/link';

export default function HomeHero({
  suggestedCount = 0,
  postCount = 0
}: {
  suggestedCount?: number;
  postCount?: number;
}) {
  return (
    <section className="relative grid min-h-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a2447] p-9 text-white shadow-[0_20px_48px_rgba(10,36,71,0.25)] lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end max-sm:p-7">
      <div className="pointer-events-none absolute -right-[60px] -top-[60px] h-80 w-80 rounded-full border-2 border-white/[0.04]" />
      <div className="pointer-events-none absolute -right-[90px] -top-[90px] h-[420px] w-[420px] rounded-full border-2 border-white/[0.025]" />

      <div className="relative z-10 min-w-0">
        <p className="mb-3 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#f9c900]">
          <span className="h-0.5 w-[18px] rounded-full bg-[#f9c900]" />
          Temporada activa
        </p>

        <h1 className="font-display text-[clamp(52px,7vw,88px)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-white">
          Encuentra <span className="text-[#f9c900]">rival</span> para tu próximo amistoso
        </h1>

        <p className="mt-4 max-w-[380px] text-[15px] leading-[1.55] text-white/60">
          Los matches ya están listos: día, horario, categoría y cancha compatibles. Solo queda confirmar.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/publicar" className="inline-flex items-center justify-center rounded-xl bg-[#f9c900] px-[18px] py-2.5 text-[13.5px] font-bold text-[#0a2447] shadow-[0_4px_14px_rgba(249,201,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffd114] hover:shadow-[0_6px_20px_rgba(249,201,0,0.45)]">
            Publicar equipo
          </Link>
          <Link href="/explorar" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-[18px] py-2.5 text-[13.5px] font-semibold text-white/90 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15">
            Explorar equipos
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-8 grid gap-2.5 lg:mt-0">
        <HeroStat label="Equipos activos" value={postCount} unit={postCount === 1 ? 'equipo' : 'equipos'} />
        <HeroStat label="Matches disponibles" value={suggestedCount} unit={suggestedCount === 1 ? 'match' : 'matches'} />
      </div>
    </section>
  );
}

function HeroStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-[18px] py-4 backdrop-blur-sm transition hover:bg-white/[0.11]">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">{label}</p>
      <p className="mt-0.5 font-display text-[44px] font-black leading-none tracking-tight text-white">
        {value} <span className="align-middle font-sans text-lg font-semibold text-white/60">{unit}</span>
      </p>
    </div>
  );
}
