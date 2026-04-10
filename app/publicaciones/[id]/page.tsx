import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditAvailabilityForm from '@/components/edit-availability-form';
import { getAvailabilityById } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PublicacionDetallePage({ params }: { params: { id: string } }) {
  const post = await getAvailabilityById(params.id);
  if (!post) return notFound();

  return (
    <main className="section">
      <Link href="/explorar" className="editorial-link">
        ← Volver a publicaciones
      </Link>

      <section className="mt-4 card-panel p-5 sm:p-6">
        <p className="text-sm text-muted">Detalle de disponibilidad</p>
        <h1 className="mt-1 display-serif text-4xl text-ink">{post.club_name}</h1>
        <p className="mt-2 text-sm text-muted">
          {post.comuna} · {post.branch} · {post.age_category}
        </p>
        <p className="mt-1 text-sm text-muted">Horario: {post.start_time?.slice(0, 5)} - {post.end_time?.slice(0, 5)}</p>
        {post.logo_url ? <img src={post.logo_url} alt={`Logo ${post.club_name}`} className="mt-3 h-20 w-20 rounded-full border border-line object-cover" /> : null}
        <div className="mt-3 space-y-1 text-sm text-muted">
          {post.phone ? <p>Teléfono: <a href={`tel:${post.phone.replace(/[\s()\-]/g, '')}`} className="text-accent hover:underline">{post.phone}</a></p> : null}
          {post.instagram ? <p>Instagram: <a href={`https://instagram.com/${post.instagram}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">@{post.instagram}</a></p> : null}
        </div>
      </section>

      {!post.contact_email ? (
        <div className="card-panel mt-5 p-4 text-sm text-red-700">
          Esta publicación no se puede editar porque no tiene correo asociado.
        </div>
      ) : (
        <>
          <h2 className="mt-6 display-serif text-3xl text-ink">Editar disponibilidad</h2>
          <p className="mt-2 text-sm text-muted">Para editar, primero verifica el correo usado al crear la publicación.</p>
          <EditAvailabilityForm post={post} />
        </>
      )}
    </main>
  );
}
