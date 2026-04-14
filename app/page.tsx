import Link from 'next/link';
import MatchPhotoCard from '@/components/match-photo-card';
import MatchPhotoForm from '@/components/match-photo-form';
import PostCard from '@/components/post-card';
import PublishForm from '@/components/publish-form';
import TeamRankingCard from '@/components/team-ranking-card';
import SuggestedMatchCardView from '@/components/suggested-match-card';
import {
  getClubStatsRanking,
  getFeaturedSuggestedMatch,
  getLiveSuggestedMatches,
  getOpenAvailabilities,
  getRecentMatchPhotos,
  getRemainingSuggestedMatches
} from '@/lib/data';
import type { AvailabilityWithTeam, ClubStatsCard, MatchPhotoRow, SuggestedMatchCard } from '@/lib/types';

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
  }
];

const branchLabel: Record<string, string> = {
  femenina: 'Femenina',
  masculina: 'Masculina',
  mixta: 'Mixta'
};

function groupByBranch<T extends { branch: string }>(items: T[]) {
  return {
    femenina: items.filter((item) => item.branch === 'femenina'),
    mixta: items.filter((item) => item.branch === 'mixta'),
    masculina: items.filter((item) => item.branch === 'masculina')
  };
}

export default async function HomePage() {
  let posts: AvailabilityWithTeam[] = [];
  let photos: MatchPhotoRow[] = [];
  let ranking: ClubStatsCard[] = [];
  let suggestedMatches: SuggestedMatchCard[] = [];

  try {
    const [availablePosts, recentPhotos, clubRanking, liveMatches] = await Promise.all([
      getOpenAvailabilities(6),
      getRecentMatchPhotos(6),
      getClubStatsRanking(6),
      getLiveSuggestedMatches(12)
    ]);

    posts = availablePosts;
    photos = recentPhotos;
    ranking = clubRanking;
    suggestedMatches = liveMatches;
  } catch (error) {
    console.error('HomePage data load failed', error);
  }

  const safeSuggestedMatches = suggestedMatches.filter((match) => {
    const isValid = Boolean(match?.a?.id && match?.b?.id);

    if (!isValid) {
      console.error('HomePage invalid suggested match payload', {
        route: '/',
        matchId: match?.id || 'unknown'
      });
    }

    return isValid;
  });

  const featuredMatch = getFeaturedSuggestedMatch(safeSuggestedMatches);
  const remainingMatches = getRemainingSuggestedMatches(safeSuggestedMatches, featuredMatch);

  const groupedPosts = groupByBranch(posts);
  const groupedMatches = groupByBranch(remainingMatches);

  return (
    <main className="pb-16">
      <header className="mx-auto mt-4 w-full max-w-6xl px-4 sm:mt-6 sm:px-6 md:mt-8 md:px-8">
        <nav className="nav-shell">
          <div className="pr-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Amistosos Vóley</p>
            <p className="text-sm text-muted">Comunidad para coordinar partidos</p>
          </div>
          <div className="hidden items-center gap-2 md:flex md:gap-3">
            <Link href="/explorar" className="nav-link">
              Explorar
            </Link>
            <Link href="/ranking" className="nav-link">
              Ranking
            </Link>
            <Link href="/resultados" className="nav-link">
              Resultados
            </Link>
            <a href="/publicar" className="btn-accent">
              Publicar
            </a>
          </div>
          <details className="group ml-auto w-full md:hidden">
            <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-white/80 px-4 py-2 text-sm text-ink">
              Menú
              <span className="text-xs text-muted transition group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-3 grid gap-2 border-t border-line/80 pt-3">
              <Link href="/explorar" className="nav-link text-center">
                Explorar
              </Link>
              <Link href="/ranking" className="nav-link text-center">
                Ranking
              </Link>
              <Link href="/resultados" className="nav-link text-center">
                Resultados
              </Link>
              <a href="/publicar" className="btn-accent text-center">
                Publicar
              </a>
            </div>
          </details>
        </nav>
      </header>

      <section className="section pt-6 sm:pt-10 md:pt-14">
        <div className="hero-shell">
          <div>
            <p className="eyebrow">Coordina amistosos sin vueltas</p>
            <h1 className="display-serif mt-4 text-4xl leading-[0.95] text-ink sm:text-5xl md:text-7xl">
              Organiza partidos de vóley
              <br />
              con equipos reales
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:mt-6 sm:text-lg">
              Publica disponibilidad, encuentra rivales por zona y registra resultados para mantener activa la comunidad.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <a href="/publicar" className="btn-accent text-center">
                Publica tu disponibilidad
              </a>
              <a href="#publicaciones" className="btn-secondary text-center">
                Ver equipos disponibles
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4">
            {howItWorks.map((item) => (
              <article key={item.step} className="step-card">
                <p className="text-xs tracking-[0.15em] text-muted">PASO {item.step}</p>
                <h3 className="mt-1 display-serif text-xl text-ink sm:text-2xl">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-2 md:pt-4">
        <div className="feature-strip">
          <p className="display-serif text-2xl text-ink md:text-3xl">Cómo funciona rápido</p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Esta plataforma está pensada para clubes y equipos que quieren cerrar amistosos de forma simple: publicar,
            coordinar y dejar registro de partidos reales.
          </p>
        </div>
      </section>

      <section id="publicaciones" className="section">
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end sm:gap-3">
          <h2 className="display-serif text-3xl text-ink sm:text-4xl">Publicaciones disponibles</h2>
          <Link href="/explorar" className="editorial-link">
            Ver todas las publicaciones
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-muted">Aún no hay publicaciones. ¡Sé el primero en publicar!</p>
        ) : (
          <div className="space-y-6">
            {(['femenina', 'mixta', 'masculina'] as const).map((branch) => {
              const branchPosts = groupedPosts[branch];
              if (!branchPosts.length) return null;

              return (
                <div key={branch}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{branchLabel[branch]}</h3>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {branchPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="publicar" className="section pt-0">
        <h2 className="mb-6 display-serif text-3xl text-ink sm:text-4xl">Publica cuándo puedes jugar</h2>
        <PublishForm />
      </section>

      <section className="section pt-0">
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end sm:gap-3">
          <h2 className="display-serif text-3xl text-ink sm:text-4xl">Matches disponibles</h2>
          <p className="text-sm text-muted">Priorizados por rama, categoría, días, horario, cancha y comuna.</p>
        </div>

        {!featuredMatch ? (
          <p className="text-muted">Todavía no hay coincidencias suficientes. Publica tu disponibilidad para activar el matching.</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Match de la fecha</h3>
              <p className="mt-1 text-sm text-muted">El cruce con mejor score total disponible ahora mismo.</p>
              <div className="mt-3">
                <SuggestedMatchCardView match={featuredMatch} featured />
              </div>
            </div>

            {remainingMatches.length > 0 ? (
              <div className="space-y-6">
                {(['femenina', 'mixta', 'masculina'] as const).map((branch) => {
                  const branchMatches = groupedMatches[branch];
                  if (!branchMatches.length) return null;

                  return (
                    <div key={branch}>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{branchLabel[branch]}</h3>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {branchMatches.map((match) => (
                          <SuggestedMatchCardView key={match.id} match={match} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section id="partidos-reales" className="section pt-0">
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end sm:gap-3">
          <h2 className="display-serif text-3xl text-ink sm:text-4xl">Galería de partidos reales</h2>
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
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="display-serif text-3xl text-ink sm:text-4xl">Ranking ELO</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              El ranking se basa en un sistema ELO. Cada equipo tiene un puntaje que sube cuando gana y baja cuando
              pierde. Si ganas contra un equipo con más victorias, subes más puntos. Si pierdes contra uno con menos
              victorias, bajas más puntos.
            </p>
          </div>
          <Link href="/ranking" className="editorial-link">
            Ver tabla completa
          </Link>
        </div>
        {ranking.length === 0 ? (
          <p className="text-muted">Cuando se registren resultados, el ranking aparecerá aquí.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ranking.map((team, index) => (
              <TeamRankingCard key={team.id} team={team} position={index + 1} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
