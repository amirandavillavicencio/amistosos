import Link from 'next/link';
import type { SuggestedMatchCard } from '@/lib/types';

export default function SuggestedMatchPanel({ matches }: { matches?: SuggestedMatchCard[] }) {
  const count = matches?.length ?? 0;

  return (
    <aside className="rounded-[2rem] border border-[#d6e3fb] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-3xl text-[#0f2f6a]">Publica y confirma</h2>
      <p className="mt-2 text-sm text-[#2d4f88]">Sigue este flujo para cerrar un amistoso sin perder detalle.</p>

      <ol className="mt-4 space-y-3 text-sm text-[#12336a]">
        <li className="rounded-xl border border-[#dbe7fb] bg-[#f7faff] p-3"><span className="font-semibold">1. Publica disponibilidad:</span> indica día, horario, categoría y rama.</li>
        <li className="rounded-xl border border-[#dbe7fb] bg-[#f7faff] p-3"><span className="font-semibold">2. El sistema busca matches:</span> combina equipos compatibles automáticamente.</li>
        <li className="rounded-xl border border-[#dbe7fb] bg-[#f7faff] p-3"><span className="font-semibold">3. Confirma con tu código:</span> acepta solo desde el enlace de confirmación seguro.</li>
      </ol>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#4d74b2]">Hoy hay {count} matches disponibles</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/publicar" className="btn-accent">Publica disponibilidad</Link>
        <Link href="/explorar" className="btn-secondary">Ver todos</Link>
      </div>
    </aside>
  );
}
