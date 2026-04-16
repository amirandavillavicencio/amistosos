import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditAvailabilityForm from '@/components/edit-availability-form';
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
          {post.phone ? <p>Teléfono: <a href={`tel:${post.phone.replace(/[\s()\-]/g, '')}`} className="text-fuchsia-200 hover:underline">{post.phone}</a></p> : null}
          {post.instagram ? <p>Instagram: <a href={`https://instagram.com/${post.instagram}`} target="_blank" rel="noreferrer" className="text-fuchsia-200 hover:underline">@{post.instagram}</a></p> : null}
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
          <h2 className="mt-6 text-xl font-bold text-white sm:text-2xl">Editar disponibilidad</h2>
          <p className="mt-2 text-sm text-slate-300">Primero verifica el correo usado al crear la publicación.</p>
          <EditAvailabilityForm post={post} />
        </>
      )}
    </main>
  );
}
