import Link from 'next/link';

export default function HomeHero({
  suggestedCount = 0,
  postCount = 0
}: {
  suggestedCount?: number;
  postCount?: number;
}) {
  return (
    <section className="app-card relative overflow-hidden border-fuchsia-400/25 bg-slate-950/95 p-5 sm:p-6 md:p-7">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-200">Amistosos Vóley</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">Salta a la cancha</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">Conecta equipos, coordina cruces y mantené el ritmo de competencia.</p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/publicar"
              className="btn-accent"
            >
              Publicar
            </Link>
            <Link
              href="/ranking"
              className="btn-secondary"
            >
              Ver ranking
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:min-w-72">
          <div className="rounded-2xl border border-violet-300/35 bg-violet-500/10 p-3.5 backdrop-blur">
            <p className="whitespace-nowrap text-[11px] uppercase tracking-wider text-violet-100/90">Cruces activos</p>
            <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{suggestedCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/35 bg-emerald-500/10 p-3.5 backdrop-blur">
            <p className="whitespace-nowrap text-[11px] uppercase tracking-wider text-emerald-100/90">Publicaciones</p>
            <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{postCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
