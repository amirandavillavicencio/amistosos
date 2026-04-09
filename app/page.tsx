import Link from 'next/link';
import MatchPhotoCard from '@/components/match-photo-card';
import MatchPhotoForm from '@/components/match-photo-form';
import PostCard from '@/components/post-card';
import PublishForm from '@/components/publish-form';
import TeamRankingCard from '@/components/team-ranking-card';
import { getClubStatsRanking, getOpenAvailabilities, getRecentMatchPhotos } from '@/lib/data';

export const dynamic = 'force-dynamic';

const innovationCards = [
  {
    title: 'COCKTAIL SGD',
    body: 'Optimizamos rutas de entrenamiento para que los equipos publiquen y encuentren amistosos con menos fricción.'
  },
  {
    title: 'FLASHATTENTION 2',
    body: 'El flujo de coordinación ahora prioriza respuestas rápidas, historial reciente y compatibilidad de nivel.'
  },
  {
    title: 'SUB-QUADRATIC ARCHITECTURES',
    body: 'La plataforma soporta más publicaciones activas con filtros simples por comuna, horario y categoría.'
  },
  {
    title: 'REDPAJAMA',
    body: 'Hicimos la experiencia más editorial para destacar partidos reales y equipos con actividad verificada.'
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
      <div className="mx-auto mt-8 w-full max-w-5xl overflow-hidden rounded-[26px] border border-[#d7dbe3] bg-white shadow-[0_24px_70px_rgba(12,25,52,0.16)]">
        <p className="bg-[#1f6fff] px-6 py-2 text-center text-[11px] font-medium text-white/90">
          Tu red para coordinar amistosos de vóley con datos reales y equipos activos.
        </p>

        <header className="border-b border-[#edf0f5] px-6 py-4 md:px-10">
          <nav className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#4f5d77]">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-[#dbe2f0] px-3 py-1 text-xs">amistosos.ai</span>
              <span className="text-xs text-[#7a859b]">plataforma comunitaria</span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/explorar" className="hover:text-[#1f6fff]">
                Explorar
              </Link>
              <Link href="/ranking" className="hover:text-[#1f6fff]">
                Ranking
              </Link>
              <Link href="/resultados" className="hover:text-[#1f6fff]">
                Resultados
              </Link>
              <a href="#publicar" className="rounded-full bg-[#1f6fff] px-3 py-1.5 text-xs font-medium text-white">
                Empezar
              </a>
            </div>
          </nav>
        </header>

        <section className="grid gap-10 px-6 py-12 md:grid-cols-[1.03fr_1fr] md:px-10">
          <div>
            <h1 className="text-6xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#0f172a] md:text-7xl">
              together
              <br />
              <span className="text-[#1f6fff]">.we grow</span>
            </h1>
            <p className="mt-9 max-w-sm text-[29px] leading-[1.12] tracking-[-0.03em] text-[#18243b]">
              La red más rápida para cerrar amistosos con información real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#publicar" className="rounded-full bg-[#1f6fff] px-5 py-2 text-sm font-medium text-white">
                Start building now
              </a>
              <a href="#publicaciones" className="rounded-full border border-[#d7deeb] px-5 py-2 text-sm text-[#32425f]">
                Contact teams
              </a>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-[#1a253b]">
            {[ 
              ['01', 'MATCH DISCOVERY', 'Encuentra clubes disponibles por horario, nivel y zona.'],
              ['02', 'TEAM FINE-TUNING', 'Publica una solicitud precisa y recibe respuestas mejor filtradas.'],
              ['03', 'REAL GAME FEED', 'Sube resultados y fotos para validar actividad semanal.'],
              ['04', 'OPEN RANKING', 'El ranking se construye solo con partidos compartidos por la comunidad.']
            ].map((item) => (
              <article key={item[0]} className="rounded-2xl border border-[#e9edf5] px-4 py-4">
                <p className="text-xs tracking-[0.16em] text-[#76839c]">{item[0]}</p>
                <h3 className="mt-1 text-sm font-semibold tracking-[0.04em]">{item[1]}</h3>
                <p className="mt-1 text-sm text-[#607089]">{item[2]}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[#edf0f5] px-6 py-9 md:px-10">
          <p className="text-sm text-[#61708a]">Trusted by</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-lg font-semibold text-[#0f172a] md:grid-cols-5">
            <span>Pika</span>
            <span>Latitude</span>
            <span>iam+</span>
            <span>WOODWARE</span>
            <span>VolleyHub</span>
          </div>
        </section>

        <section className="px-6 py-16 md:px-10">
          <div className="relative mx-auto grid max-w-3xl place-items-center text-center">
            <div className="absolute h-64 w-64 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f8f9fd,#e7ebf4)]" />
            <p className="relative text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#0f172a]">
              THE FASTEST CLOUD FOR GEN AI.
            </p>
            <p className="relative mt-2 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#1f6fff]">
              BUILT ON LEADING AI RESEARCH.
            </p>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#1a253b]">Innovations</h2>
            <div className="md:justify-self-end md:text-right">
              <p className="max-w-sm text-sm text-[#64758f]">
                Mejoramos el flujo para que coordinadores y capitanes puedan concretar partidos sin cadenas eternas de mensajes.
              </p>
              <a href="#publicaciones" className="mt-3 inline-block rounded-full border border-[#d8deea] px-4 py-1.5 text-sm text-[#32425f]">
                See all research
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {innovationCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-[#e8ecf4] p-6">
                <h3 className="text-sm font-semibold tracking-[0.08em] text-[#1a2438]">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#65758f]">{card.body}</p>
                <a href="#publicaciones" className="mt-4 inline-block text-xs font-semibold text-[#1f6fff]">
                  Read more →
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 pb-6 md:px-10">
          <div className="rounded-3xl border border-[#e6ebf5] bg-[#f9fbff] p-8">
            <h2 className="text-6xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#111827] md:text-7xl">
              <span className="rounded-full bg-[#1f6fff] px-4 text-white">100+</span> OPEN <span className="rounded-full bg-[#111827] px-4 text-white">MODELS</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-[#607089]">
              Adaptamos este estilo visual de producto tecnológico para una experiencia más moderna, clara y editorial en Amistosos Vóley.
            </p>
          </div>
        </section>
      </div>

      <section id="publicaciones" className="section">
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
