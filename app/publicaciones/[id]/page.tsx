import Link from 'next/link';
import { notFound } from 'next/navigation';
import TeamContact from '@/components/team-contact';
import { EmptyState, SectionShell, StatusBadge } from '@/components/ui-shell';
import { getAvailabilityById } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PublicacionDetallePage({ params }: { params: { id: string } }) {
  const post = await getAvailabilityById(params.id);
  if (!post) return notFound();

  return (
    <main className="section">
      <Link href="/explorar" className="editorial-link">← Volver a publicaciones</Link>

      <SectionShell className="mt-4">
        <p className="app-eyebrow">Detalle de disponibilidad</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="app-title text-3xl sm:text-4xl">{post.club_name}</h1>
            <p className="mt-2 text-sm text-slate-300">{post.comuna} · {post.branch} · {post.age_category}</p>
            <p className="mt-1 text-sm text-slate-300">Horario: {post.start_time?.slice(0, 5)} - {post.end_time?.slice(0, 5)}</p>
          </div>
          <StatusBadge tone="accent">Publicación activa</StatusBadge>
        </div>

        {post.logo_url ? <img src={post.logo_url} alt={`Logo ${post.club_name}`} className="mt-3 h-20 w-20 rounded-full border border-slate-600 object-cover" /> : null}
        <div className="mt-3 space-y-1 text-sm text-slate-300">
          <TeamContact
            instagram={post.instagram}
            phone={post.phone}
            className="space-y-1 text-sm text-slate-300"
            labelClassName="font-medium text-slate-100"
            valueClassName="text-fuchsia-200 hover:underline"
          />
          <p>Cancha: {post.has_court ? 'Sí pone cancha' : 'No pone cancha'}</p>
          <p>Ciudad: {post.city || 'No informada'}</p>
        </div>

        {post.notes ? <p className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/50 p-3 text-sm text-slate-200">{post.notes}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/publicaciones/${post.id}/editar`} className="btn-accent">Editar disponibilidad</Link>
          <Link href="/explorar" className="btn-secondary">Ver más publicaciones</Link>
        </div>
      </SectionShell>

      {!post.contact_email ? (
        <div className="mt-5">
          <EmptyState
            title="Esta publicación no se puede editar"
            description="No tiene correo asociado para validación."
          />
        </div>
      ) : null}
    </main>
  );
}
