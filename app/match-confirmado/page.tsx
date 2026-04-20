import Link from 'next/link';

export default function MatchConfirmadoPage() {
  return (
    <main className="section py-10">
      <article className="card-panel mx-auto max-w-2xl p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Amistosos Vóley</p>
        <h1 className="mt-1 display-serif text-3xl text-ink">Match confirmado</h1>
        <p className="mt-3 text-sm text-muted">
          ¡Listo! El match quedó confirmado y ya pueden seguir coordinando desde la sección de matches.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/explorar" className="btn-accent">Ver matches</Link>
          <Link href="/" className="btn-secondary">Volver al inicio</Link>
        </div>
      </article>
    </main>
  );
}
