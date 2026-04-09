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
      <header className="section pb-8">
        <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <p className="text-lg font-semibold">Amistosos Vóley</p>
          <div className="flex gap-4 text-sm text-slate-300">
            <Link href="/explorar">Explorar</Link>
            <Link href="/ranking">Ranking</Link>
          </div>
        </nav>
      </header>

      <section className="section pt-2">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-accent/50 bg-accent/15 px-3 py-1 text-xs text-accent">
              Comunidad activa de vóley
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">Encuentra equipos para jugar amistosos.</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Publica cuándo puedes jugar, revisa equipos disponibles y mira partidos reales para coordinar más rápido.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#publicar" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold">
                Publica cuándo puedes jugar
              </a>
              <a href="#partidos-reales" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold">
                Mira partidos reales
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-panel/70 p-6 shadow-glow">
            <p className="text-sm text-muted">Hoy en la plataforma</p>
            <p className="mt-3 text-4xl font-bold">{posts.length}</p>
            <p className="text-sm text-slate-300">equipos disponibles para jugar</p>
            <p className="mt-6 text-4xl font-bold">{photos.length}</p>
            <p className="text-sm text-slate-300">partidos reales compartidos</p>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <h2 className="text-3xl font-semibold">Cómo funciona</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-accent">1</p>
            <h3 className="mt-2 text-lg font-semibold">Publica tu disponibilidad</h3>
            <p className="mt-2 text-sm text-slate-300">Comparte horario, comuna y nivel para que otros equipos te contacten.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-accent">2</p>
            <h3 className="mt-2 text-lg font-semibold">Revisa equipos disponibles</h3>
            <p className="mt-2 text-sm text-slate-300">Mira publicaciones recientes y encuentra rivales para esta semana.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-accent">3</p>
            <h3 className="mt-2 text-lg font-semibold">Sube fotos del partido</h3>
            <p className="mt-2 text-sm text-slate-300">Muestra actividad real y suma tus resultados al ranking abierto.</p>
          </article>
        </div>
      </section>

      <section id="publicaciones" className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold">Equipos disponibles</h2>
          <Link href="/explorar" className="text-sm text-accent">
            Ver todas las publicaciones
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-slate-400">Aún no hay publicaciones. ¡Sé el primero en publicar!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section id="publicar" className="section pt-0">
        <h2 className="mb-6 text-3xl font-semibold">Publica cuándo puedes jugar</h2>
        <PublishForm />
      </section>

      <section id="partidos-reales" className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold">Partidos reales</h2>
          <Link href="/ranking" className="text-sm text-accent">
            Ver equipos con más victorias
          </Link>
        </div>

        <MatchPhotoForm />

        {photos.length === 0 ? (
          <p className="mt-6 text-slate-400">Todavía no hay fotos. Comparte la primera y activa el ranking.</p>
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
          <h2 className="text-3xl font-semibold">Equipos con más victorias</h2>
          <Link href="/ranking" className="text-sm text-accent">
            Ver ranking completo
          </Link>
        </div>
        {ranking.length === 0 ? (
          <p className="text-slate-400">Cuando suban fotos con resultado, aparecerá el ranking aquí.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ranking.map((team, index) => (
              <TeamRankingCard key={team.id} team={team} position={index + 1} />
            ))}
          </div>
        )}
      </section>

      <section className="section pt-0">
        <div className="rounded-3xl border border-white/10 bg-panel/70 p-8 text-center">
          <h2 className="text-3xl font-semibold">¿Listos para el próximo amistoso?</h2>
          <p className="mt-2 text-slate-300">Publica tu horario y conecta con equipos que sí están jugando esta semana.</p>
          <a href="#publicar" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold">
            Empezar ahora
          </a>
        </div>
      </section>

      <footer className="section pt-0">
        <p className="text-sm text-slate-400">Amistosos Vóley · Comunidad abierta para coordinar partidos reales.</p>
      </footer>
    </main>
  );
}
