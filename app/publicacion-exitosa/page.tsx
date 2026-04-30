import Link from 'next/link';
import { PageHeader } from '@/components/ui-shell';

export default function PublicacionExitosaPage({
  searchParams
}: {
  searchParams?: {
    code?: string;
    club?: string;
  };
}) {
  const confirmationCode = String(searchParams?.code || '').trim();
  const clubName = String(searchParams?.club || '').trim();

  return (
    <main className="section">
      <PageHeader
        eyebrow="Publicación lista"
        title="Publicación realizada con éxito"
        description="Tu equipo ya quedó disponible para encontrar rival"
      />

      <section className="app-card grid gap-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-emerald-100">
          <p className="text-sm font-semibold">Tu disponibilidad ya fue publicada correctamente.</p>
          <p className="mt-1 text-sm text-emerald-200/90">Revisa matches compatibles o publica una nueva cuando quieras.</p>
        </div>

        {confirmationCode ? (
          <div className="rounded-2xl border border-[#f4c24d]/60 bg-[#fff4cf] p-4 text-[#12336a] shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7e5a00]">Código de confirmación</p>
            <p className="mt-2 text-sm">
              Guarda este código{clubName ? ` para ${clubName}` : ''}. Lo necesitarás para confirmar matches de este equipo.
            </p>
            <p className="mt-3 select-all break-words rounded-xl border border-[#f4c24d]/70 bg-white px-4 py-3 font-mono text-xl font-bold tracking-wide text-[#0f2f6a]">
              {confirmationCode}
            </p>
            <p className="mt-2 text-xs text-[#725700]">
              Este código no aparece en la publicación pública. Cópialo o guárdalo antes de cerrar esta pantalla.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-100">
            <p className="text-sm font-semibold">No se encontró un código para mostrar.</p>
            <p className="mt-1 text-sm text-amber-200/90">Si esta publicación es antigua, puedes seguir usando la app normalmente.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary">
            Volver al inicio
          </Link>
          <Link href="/explorar" className="btn-accent">
            Explorar equipos
          </Link>
        </div>
      </section>
    </main>
  );
}
