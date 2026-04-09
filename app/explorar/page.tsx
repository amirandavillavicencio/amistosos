import Link from 'next/link';
import PostCard from '@/components/post-card';
import { getOpenAvailabilities } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ExplorarPage() {
  const posts = await getOpenAvailabilities(60);

  return (
    <main className="section">
      <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-accent">Explorar equipos</p>
          <h1 className="display-serif text-4xl text-ink sm:text-5xl">Disponibilidades abiertas</h1>
        </div>
        <Link href="/" className="rounded-xl border border-line bg-ivory px-4 py-2 text-sm text-ink">
          Volver al inicio
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted">No hay publicaciones abiertas por ahora.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
