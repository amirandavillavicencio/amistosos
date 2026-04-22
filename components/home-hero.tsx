import Link from 'next/link';

export default function HomeHero({
  suggestedCount = 0,
  postCount = 0
}: {
  suggestedCount?: number;
  postCount?: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-slate-950 p-5 shadow-[0_22px_60px_rgba(5,10,26,0.7)] sm:p-6">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-200">Amistosos Vóley</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">Salta a la cancha</h1>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/publicar"
              className="inline-flex rounded-full border border-fuchsia-300/60 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(217,70,239,0.45)] transition hover:brightness-110"
            >
              Publicar
            </Link>
            <Link
              href="/ranking"
              className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              Ver ranking
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-72">
          <div className="rounded-2xl border border-violet-300/35 bg-violet-500/10 p-3 backdrop-blur">
            <p className="whitespace-nowrap text-[11px] uppercase tracking-wider text-violet-100/90">Cruces</p>
            <p className="mt-1 text-2xl font-black text-white">{suggestedCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/35 bg-emerald-500/10 p-3 backdrop-blur">
            <p className="whitespace-nowrap text-[11px] uppercase tracking-wider text-emerald-100/90">Publicaciones</p>
            <p className="mt-1 text-2xl font-black text-white">{postCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
