import Link from 'next/link';

export default function HomeHero() {
  return (
    <section className="rounded-3xl border border-line/70 bg-ivory/95 p-5 shadow-soft sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Amistosos Vóley</p>
      <h1 className="mt-2 text-2xl font-semibold leading-tight text-ink sm:text-3xl">Encuentra rival y activa tu próximo amistoso</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Match destacado, publicaciones activas, ranking ELO y resultados recientes en una vista compacta y útil.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link href="/publicar" className="btn-accent">
          Publicar disponibilidad
        </Link>
        <Link href="/ranking" className="btn-secondary">
          Ver ranking
        </Link>
      </div>
    </section>
  );
}
