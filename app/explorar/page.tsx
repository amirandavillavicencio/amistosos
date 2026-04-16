import Link from 'next/link';
import PostCard from '@/components/post-card';
import { EmptyState, PageHeader, SectionShell } from '@/components/ui-shell';
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
      <PageHeader
        eyebrow="Explorar equipos"
        title="Disponibilidades abiertas"
        description="Filtra por rama, día y categoría para encontrar rivales que sí calzan con tu disponibilidad real."
        action={<Link href="/" className="btn-secondary">Volver al inicio</Link>}
      />

      <SectionShell className="mb-5">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" method="GET">
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

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
            <button type="submit" className="btn-accent">Aplicar filtros</button>
            <Link href="/explorar" className="btn-secondary">Limpiar</Link>
          </div>
        </form>
      </SectionShell>

      {posts.length === 0 ? (
        <EmptyState
          title="Todavía no hay partidos publicados"
          description="Tu equipo puede ser el primero en activar la rueda de amistosos en tu zona."
          action={<Link href="/publicar" className="btn-accent">Publicar mi disponibilidad</Link>}
        />
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
