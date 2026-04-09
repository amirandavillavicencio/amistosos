import Link from 'next/link';
import PostCard from '@/components/post-card';
import PublishForm from '@/components/publish-form';
import TeamRankingCard from '@/components/team-ranking-card';
import { getOpenAvailabilities, getSuggestedMatches, getTopTeams } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [posts, suggestions, topTeams] = await Promise.all([
    getOpenAvailabilities(9),
    getSuggestedMatches(8),
    getTopTeams(6)
  ]);

  return (
    <main>
      <header className="section pb-8">
        <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <p className="text-lg font-semibold">Amistosos Vóley</p>
          <div className="flex gap-4 text-sm text-slate-300">
            <Link href="/explorar">Explorar</Link>
            <Link href="/ranking">Ranking</Link>
            <Link href="/resultados">Registrar resultado</Link>
          </div>
        </nav>
      </header>

      <section className="section pt-2">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-accent/50 bg-accent/15 px-3 py-1 text-xs text-accent">
              Matchmaking + ELO · Sin login obligatorio
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Publica, compite y encuentra amistosos con rivales de nivel real.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Mantén el flujo rápido de publicación y suma historial deportivo con victorias, derrotas, ELO y
              sugerencias más inteligentes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#publicar" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold">
                Publicar disponibilidad
              </a>
              <Link href="/resultados" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold">
                Cargar resultado
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-panel/70 p-6 shadow-glow">
            <p className="text-sm text-muted">Estado competitivo</p>
            <p className="mt-3 text-4xl font-bold">{posts.length}</p>
            <p className="text-sm text-slate-300">disponibilidades abiertas</p>
            <p className="mt-6 text-4xl font-bold">{topTeams.length}</p>
            <p className="text-sm text-slate-300">equipos rankeados con ELO</p>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold">Equipos destacados</h2>
          <Link href="/ranking" className="text-sm text-accent">
            Ver ranking completo
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topTeams.map((team, index) => (
            <TeamRankingCard key={team.id} team={team} position={index + 1} />
          ))}
        </div>
      </section>

      <section id="publicaciones" className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold">Disponibilidades recientes</h2>
          <Link href="/explorar" className="text-sm text-accent">
            Explorar todo
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
        <h2 className="mb-6 text-3xl font-semibold">Publica tu disponibilidad</h2>
        <PublishForm />
      </section>

      <section className="section pt-0">
        <h2 className="text-3xl font-semibold">Matching sugerido con ELO</h2>
        <p className="mt-2 text-sm text-muted">
          El algoritmo pondera horario, ubicación, rama, nivel y cercanía de ELO. Si un equipo es nuevo, aplica score
          deportivo neutro hasta tener historial suficiente.
        </p>

        {suggestions.length === 0 ? (
          <p className="mt-6 text-slate-400">Todavía no hay sugerencias activas.</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {suggestions.map((match) => (
              <article key={match.id} className="rounded-2xl border border-white/10 bg-panel/80 p-5">
                <p className="text-xs uppercase tracking-wide text-accent">Compatibilidad {match.totalScore}%</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {match.a.team.club_name} ↔ {match.b.team.club_name}
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  {match.a.comuna} · {match.a.start_time.slice(0, 5)}-{match.a.end_time.slice(0, 5)} · {match.a.branch}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Schedule {match.scheduleScore} · Ubicación {match.locationScore} · Nivel {match.levelScore} · ELO{' '}
                  {match.eloScore}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <a className="rounded-lg bg-white/10 px-3 py-2" href={`mailto:${match.a.team.contact_email}`}>
                    Mail {match.a.team.club_name}
                  </a>
                  <a
                    className="rounded-lg bg-white/10 px-3 py-2"
                    href={`https://instagram.com/${match.b.team.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    IG {match.b.team.club_name}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
