import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditAvailabilityAccess from '@/components/edit-availability-access';
import { EmptyState, SectionShell, StatusBadge } from '@/components/ui-shell';
import { getAvailabilityById } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function EditarPublicacionPage({ params }: { params: { id: string } }) {
  const post = await getAvailabilityById(params.id);
  if (!post) return notFound();

  return (
    <main className="section">
      <Link href={`/publicaciones/${post.id}`} className="editorial-link">← Volver al detalle</Link>

      <SectionShell className="mt-4">
        <p className="app-eyebrow">Editar publicación</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="app-title text-3xl sm:text-4xl">{post.club_name}</h1>
            <p className="mt-2 text-sm text-slate-300">{post.comuna} · {post.branch} · {post.age_category}</p>
            <p className="mt-1 text-sm text-slate-300">Horario: {post.start_time?.slice(0, 5)} - {post.end_time?.slice(0, 5)}</p>
          </div>
          <StatusBadge tone="accent">Publicación activa</StatusBadge>
        </div>
      </SectionShell>

      {!post.contact_email ? (
        <div className="mt-5">
          <EmptyState
            title="Esta publicación no se puede editar"
            description="No tiene correo asociado para validación."
          />
        </div>
      ) : (
        <>
          <h2 className="mt-6 text-xl font-bold text-white sm:text-2xl">Validar correo para editar</h2>
          <p className="mt-2 text-sm text-slate-300">Solo el correo con que se creó la publicación puede modificarla.</p>
          <EditAvailabilityAccess post={post} />
        </>
      )}
    </main>
  );
}
