import Link from 'next/link';
import PostCard from '@/components/post-card';
import { getOpenAvailabilities } from '@/lib/data';
import type { AvailabilityWithTeam } from '@/lib/types';

export const dynamic = 'force-dynamic';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

interface ExplorarPageProps {
  searchParams?: {
    rama?: string;
    dia?: string;
    categoria?: string;
  };
}

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const branch = searchParams?.rama || '';
  const weekday = searchParams?.dia || '';
  const ageCategory = searchParams?.categoria || '';

  let posts: AvailabilityWithTeam[] = [];

  try {
    posts = await getOpenAvailabilities(60, {
      branch: branch || undefined,
      weekday: weekday || undefined,
      ageCategory: ageCategory || undefined
    });
  } catch (error) {
    console.error('ExplorarPage data load failed', {
      route: '/explorar',
      branch,
      weekday,
      ageCategory,
      error
    });
  }

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

      <form className="card-panel mb-6 grid gap-3 p-4 sm:grid-cols-4" method="GET">
        <select name="categoria" defaultValue={ageCategory} className="field">
          <option value="">Todas las categorías</option>
          <option value="sub-12">Sub-12</option>
          <option value="sub-14">Sub-14</option>
          <option value="sub-16">Sub-16</option>
          <option value="sub-18">Sub-18</option>
          <option value="sub-20">Sub-20</option>
          <option value="tc">Todo Competidor (TC)</option>
        </select>

        <select name="rama" defaultValue={branch} className="field">
          <option value="">Todas las ramas</option>
          <option value="femenina">Femenina</option>
          <option value="masculina">Masculina</option>
          <option value="mixta">Mixta</option>
        </select>

        <select name="dia" defaultValue={weekday} className="field">
          <option value="">Cualquier día</option>
          {weekdays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <div className="sm:col-span-4 flex gap-2">
          <button type="submit" className="btn-accent">Aplicar filtros</button>
          <Link href="/explorar" className="btn-secondary">Limpiar</Link>
        </div>
      </form>

      {posts.length === 0 ? (
        <div className="card-panel flex flex-col items-center gap-4 p-8 text-center">
          <h2 className="display-serif text-2xl text-ink">Todavía no hay partidos publicados</h2>
          <p className="max-w-xl text-sm text-muted">Tu equipo puede ser el primero en activar la rueda de amistosos en tu zona.</p>
          <Link href="/publicar" className="btn-accent">Publicar mi disponibilidad</Link>
        </div>
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
