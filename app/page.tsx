import Link from 'next/link';
import MatchPhotoCard from '@/components/match-photo-card';
import MatchPhotoForm from '@/components/match-photo-form';
import PostCard from '@/components/post-card';
import PublishForm from '@/components/publish-form';
import TeamRankingCard from '@/components/team-ranking-card';
import { getClubStatsRanking, getOpenAvailabilities, getRecentMatchPhotos } from '@/lib/data';

export const dynamic = 'force-dynamic';

const howItWorks = [
  {
    step: '01',
    title: 'Encuentra equipos para jugar',
    description: 'Revisa disponibilidades reales por comuna, horario y rama.'
  },
  {
    step: '02',
    title: 'Publica tu disponibilidad',
    description: 'Comparte cuándo pueden jugar y cómo contactar a tu equipo.'
  },
  {
    step: '03',
    title: 'Sube partidos reales',
    description: 'Comparte fotos y resultados para dar visibilidad a la actividad.'
  },
  {
    step: '04',
    title: 'Sigue el ranking',
    description: 'La tabla se actualiza con resultados publicados por la comunidad.'
  }
];

export default async function HomePage() {
  const [posts, photos, ranking] = await Promise.all([
    getOpenAvailabilities(6),
    getRecentMatchPhotos(6),
    getClubStatsRanking(6)
  ]);

  return (
    <main className="pb-16">
      <header className="mx-auto mt-6 w-full max-w-6xl px-6 md:mt-8 md:px-8">
        <nav className="nav-shell">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Amistosos Vóley</p>
            <p className="text-sm text-muted">Comunidad para coordinar partidos</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Link href="/explorar" className="nav-link">
              Explorar
            </Link>
            <Link href="/ranking" className="nav-link">
              Ranking
            </Link>
            <Link href="/resultados" className="nav-link">
              Resultados
            </Link>
            <a href="#publicar" className="btn-accent">
              Publicar
            </a>
          </div>
        </nav>
      </header>

      <section className="section pt-10 md:pt-14">
        <div className="hero-shell">
          <div>
            <p className="eyebrow">Coordina amistosos sin vueltas</p>
            <h1 className="display-serif mt-4 text-5xl leading-[0.95] text-ink md:text-7xl">
              Organiza partidos de vóley
              <br />
              con equipos reales
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Publica disponibilidad, encuentra rivales por zona y registra resultados para mantener activa la comunidad.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#publicar" className="btn-accent">
                Publica tu disponibilidad
              </a>
              <a href="#publicaciones" className="btn-secondary">
                Ver equipos disponibles
              </a>
            </div>
          </div>

          <div className="grid gap-3">
            {howItWorks.map((item) => (
              <article key={item.step} className="step-card">
                <p className="text-xs tracking-[0.15em] text-muted">PASO {item.step}</p>
                <h3 className="mt-1 display-serif text-2xl text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-2 md:pt-4">
        <div className="feature-strip">
          <p className="display-serif text-2xl text-ink md:text-3xl">Cómo funciona</p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Esta plataforma está pensada para clubes y equipos que quieren cerrar amistosos de forma simple: publicar,
            coordinar y dejar registro de partidos reales.
          </p>
        </div>
      </section>

      <section id="publicaciones" className="section">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="display-serif text-4xl text-ink">Publicaciones disponibles</h2>
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
          <h2 className="display-serif text-4xl text-ink">Galería de partidos reales</h2>
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
          <div>
            <h2 className="display-serif text-4xl text-ink">Ranking de equipos</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              El ranking se basa en un sistema ELO. Cada equipo tiene un puntaje que sube cuando gana y baja cuando
              pierde. Si ganas contra un equipo fuerte, subes más puntos. Si pierdes contra uno más débil, bajas más.
            </p>
          </div>
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

      <section className="section pt-4">
        <div className="cta-shell">
          <p className="eyebrow">Comunidad activa</p>
          <h2 className="display-serif mt-3 text-4xl text-ink md:text-5xl">¿Listos para coordinar su próximo amistoso?</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Si tu equipo tiene horario disponible, publíquenlo y conecten con otros clubes de su ciudad.
          </p>
          <a href="#publicar" className="btn-accent mt-7 inline-flex">
            Ir al formulario de publicación
          </a>
        </div>
      </section>
    </main>
  );
}
