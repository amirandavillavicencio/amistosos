import Link from 'next/link';
import PostCard from '@/components/post-card';
import { getOpenAvailabilities } from '@/lib/data';

export const dynamic = 'force-dynamic';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

interface ExplorarPageProps {
  searchParams?: {
    rama?: string;
    nivel?: string;
    dia?: string;
  };
}

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const branch = searchParams?.rama || '';
  const level = searchParams?.nivel || '';
  const weekday = searchParams?.dia || '';

  const posts = await getOpenAvailabilities(60, {
    branch: branch || undefined,
    level: level || undefined,
    weekday: weekday || undefined
  });

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

      <form className="card-panel mb-6 grid gap-3 p-4 sm:grid-cols-3" method="GET">
        <select name="rama" defaultValue={branch} className="field">
          <option value="">Todas las ramas</option>
          <option value="femenina">Femenina</option>
          <option value="masculina">Masculina</option>
          <option value="mixta">Mixta</option>
        </select>

        <select name="nivel" defaultValue={level} className="field">
          <option value="">Todos los niveles</option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>

        <select name="dia" defaultValue={weekday} className="field">
          <option value="">Cualquier día</option>
          {weekdays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" className="btn-accent">Aplicar filtros</button>
          <Link href="/explorar" className="btn-secondary">Limpiar</Link>
        </div>
      </form>

      {posts.length === 0 ? (
        <div className="card-panel flex flex-col items-center gap-4 p-8 text-center">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="#B7C7D6" strokeWidth="2" />
            <path d="M20 44C24 37 30 33 36 33C42 33 48 37 52 44" stroke="#7A9AB3" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="28" cy="29" r="3" fill="#7A9AB3" />
            <circle cx="44" cy="29" r="3" fill="#7A9AB3" />
          </svg>
          <h2 className="display-serif text-2xl text-ink">Todavía no hay partidos publicados</h2>
          <p className="max-w-xl text-sm text-muted">
            Tu equipo puede ser el primero en activar la rueda de amistosos en tu zona.
          </p>
          <Link href="/publicar" className="btn-accent">
            Publicar mi disponibilidad
          </Link>
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
