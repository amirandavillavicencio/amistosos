import Link from 'next/link';
import MatchPhotoCard from '@/components/match-photo-card';
import MatchPhotoForm from '@/components/match-photo-form';
import PostCard from '@/components/post-card';
import PublishForm from '@/components/publish-form';
import TeamRankingCard from '@/components/team-ranking-card';
import { getClubStatsRanking, getOpenAvailabilities, getRecentMatchPhotos } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [posts, photos, ranking] = await Promise.all([
    getOpenAvailabilities(9),
    getRecentMatchPhotos(6),
    getClubStatsRanking(6)
  ]);

  return (
    <main>
      <header className="section pb-6">
        <nav className="flex items-center justify-between rounded-2xl border border-line bg-ivory/95 px-5 py-3">
          <div>
            <p className="display-serif text-2xl font-semibold text-ink">Amistosos Vóley</p>
            <p className="text-xs text-muted">Coordinación editorial de partidos reales</p>
          </div>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/explorar" className="hover:text-accent">
              Explorar
            </Link>
            <Link href="/ranking" className="hover:text-accent">
              Ranking
            </Link>
            <Link href="/resultados" className="hover:text-accent">
              Resultados
            </Link>
          </div>
        </nav>
      </header>

      <section className="section pt-2">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-line bg-ivory p-7 shadow-soft md:p-10">
            <p className="mb-4 inline-flex rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs text-accent">
              Comunidad activa de vóley
            </p>
            <h1 className="display-serif text-5xl leading-tight text-ink md:text-6xl">
              Encuentra equipos para amistosos con una coordinación más clara.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted">
              Publica horarios, revisa equipos disponibles y comparte resultados reales en una misma plataforma, con
              estructura simple y profesional.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#publicar" className="rounded-xl border border-accent/35 bg-accent px-5 py-3 text-sm font-semibold text-white">
                Publicar disponibilidad
              </a>
              <a href="#partidos-reales" className="rounded-xl border border-line bg-sand/30 px-5 py-3 text-sm font-semibold text-ink">
                Ver partidos reales
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="card-panel p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Hoy en la plataforma</p>
              <p className="mt-3 display-serif text-5xl text-ink">{posts.length}</p>
              <p className="text-sm text-muted">equipos disponibles para jugar</p>
            </div>
            <div className="card-panel p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Actividad real</p>
              <p className="mt-3 display-serif text-5xl text-ink">{photos.length}</p>
              <p className="text-sm text-muted">partidos compartidos por la comunidad</p>
            </div>
            <div className="rounded-2xl border border-line bg-sand/35 p-6">
              <p className="text-sm text-muted">Diseñado para clubes y entrenadores que necesitan decidir rápido con contexto real.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <h2 className="display-serif text-4xl text-ink">Cómo funciona</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="card-panel p-5">
            <p className="text-sm text-accent">01</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">Publica tu disponibilidad</h3>
            <p className="mt-2 text-sm text-muted">Comparte horario, comuna y nivel para que otros equipos te contacten.</p>
          </article>
          <article className="card-panel p-5">
            <p className="text-sm text-accent">02</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">Revisa equipos disponibles</h3>
            <p className="mt-2 text-sm text-muted">Mira publicaciones recientes y encuentra rivales para esta semana.</p>
          </article>
          <article className="card-panel p-5">
            <p className="text-sm text-accent">03</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">Sube fotos del partido</h3>
            <p className="mt-2 text-sm text-muted">Muestra actividad real y suma tus resultados al ranking abierto.</p>
          </article>
        </div>
      </section>

      <section id="publicaciones" className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="display-serif text-4xl text-ink">Equipos disponibles</h2>
          <Link href="/explorar" className="editorial-link">
            Ver todas las publicaciones
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-muted">Aún no hay publicaciones. ¡Sé el primero en publicar!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section id="publicar" className="section pt-0">
        <h2 className="mb-6 display-serif text-4xl text-ink">Publica cuándo puedes jugar</h2>
        <PublishForm />
      </section>

      <section id="partidos-reales" className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="display-serif text-4xl text-ink">Partidos reales</h2>
          <Link href="/ranking" className="editorial-link">
            Ver equipos con más victorias
          </Link>
        </div>

        <MatchPhotoForm />

        {photos.length === 0 ? (
          <p className="mt-6 text-muted">Todavía no hay fotos. Comparte la primera y activa el ranking.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo) => (
              <MatchPhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </section>

      <section className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="display-serif text-4xl text-ink">Equipos con más victorias</h2>
          <Link href="/ranking" className="editorial-link">
            Ver ranking completo
          </Link>
        </div>
        {ranking.length === 0 ? (
          <p className="text-muted">Cuando suban fotos con resultado, aparecerá el ranking aquí.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ranking.map((team, index) => (
              <TeamRankingCard key={team.id} team={team} position={index + 1} />
            ))}
          </div>
        )}
      </section>

      <section className="section pt-0">
        <div className="rounded-3xl border border-line bg-sand/45 p-8 text-center">
          <h2 className="display-serif text-4xl text-ink">¿Listos para el próximo amistoso?</h2>
          <p className="mt-2 text-muted">Publica tu horario y conecta con equipos que sí están jugando esta semana.</p>
          <a href="#publicar" className="mt-6 inline-flex rounded-xl border border-accent/30 bg-accent px-5 py-3 text-sm font-semibold text-white">
            Empezar ahora
          </a>
        </div>
      </section>

    </main>
  );
}
