import Link from 'next/link';
import { PageHeader } from '@/components/ui-shell';

export default function PublicacionExitosaPage() {
  return (
    <main className="section">
      <PageHeader
        eyebrow="Publicación lista"
        title="Publicación realizada con éxito"
        description="Ahora puedes encontrar rivales disponibles"
      />

      <section className="app-card grid gap-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-emerald-100">
          <p className="text-sm font-semibold">Tu disponibilidad ya fue publicada correctamente.</p>
          <p className="mt-1 text-sm text-emerald-200/90">Revisa sugerencias compatibles o publica una nueva cuando quieras.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/explorar" className="btn-accent">
            Ver matches
          </Link>
          <Link href="/publicar" className="btn-secondary">
            Publicar otra
          </Link>
        </div>
      </section>
    </main>
  );
}
