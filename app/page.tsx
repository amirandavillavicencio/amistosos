import Link from 'next/link';
import HomeHero from '@/components/home-hero';
import HomeRankingPreview from '@/components/home-ranking-preview';
import HomeResultsPreview from '@/components/home-results-preview';
import PostCard from '@/components/post-card';
import SuggestedMatchList from '@/components/suggested-match-list';
import HowItWorks from '@/components/how-it-works';
import { EmptyState } from '@/components/ui-shell';
import { rebuildSuggestedMatches } from '@/app/actions';
import {
  getClubStatsRanking,
  getCompletedSuggestedMatches,
  getMatchedSuggestedMatches,
  getOpenAvailabilities,
  logHomeProductionDiagnostics,
  getRecentResults,
  getSuggestedMatches
} from '@/lib/data';
import type { AvailabilityWithTeam, ClubStatsCard, MatchResultRow, SuggestedMatchCard } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  await logHomeProductionDiagnostics();
  await rebuildSuggestedMatches();

  let activeSuggestedMatches: SuggestedMatchCard[] = [];
  let matchedSuggestedMatches: SuggestedMatchCard[] = [];
  let completedSuggestedMatches: SuggestedMatchCard[] = [];
  let openAvailabilities: AvailabilityWithTeam[] = [];
  let ranking: ClubStatsCard[] = [];
  let recentResults: MatchResultRow[] = [];

  try {
    const [activeMatches, matchedMatches, completedMatches, availabilities, topRanking, results] = await Promise.all([
      getSuggestedMatches(6),
      getMatchedSuggestedMatches(6),
      getCompletedSuggestedMatches(6),
      getOpenAvailabilities(9),
      getClubStatsRanking(5),
      getRecentResults(5)
    ]);

    activeSuggestedMatches = Array.isArray(activeMatches) ? activeMatches : [];
    matchedSuggestedMatches = Array.isArray(matchedMatches) ? matchedMatches : [];
    completedSuggestedMatches = Array.isArray(completedMatches) ? completedMatches : [];
    openAvailabilities = Array.isArray(availabilities) ? availabilities : [];
    ranking = Array.isArray(topRanking) ? topRanking : [];
    recentResults = Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('HomePage data load failed', error);
  }

  console.log('[home] data summary', {
    activeSuggestedMatches: activeSuggestedMatches.length,
    matchedSuggestedMatches: matchedSuggestedMatches.length,
    completedSuggestedMatches: completedSuggestedMatches.length,
    openAvailabilities: openAvailabilities.length,
    ranking: ranking.length,
    recentResults: recentResults.length
  });

  return (
    <main className="section relative isolate py-8 sm:py-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(37,99,235,0.14),transparent_32%)]" />
      <div className="space-y-6 sm:space-y-7">
        <HomeHero suggestedCount={activeSuggestedMatches.length} postCount={openAvailabilities.length} />
        <HowItWorks />

        <section className="app-card relative overflow-hidden border-violet-300/25 bg-slate-950/90 p-4 sm:p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="app-eyebrow">Matchmaking</p>
              <h2 className="mt-1 text-2xl font-black text-white">Cruces activos</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center whitespace-nowrap rounded-full border border-violet-300/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                {activeSuggestedMatches.length} cruce{activeSuggestedMatches.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {activeSuggestedMatches.length === 0 ? (
            <EmptyState
              icon="⚡"
              title="Aún no hay cruces activos"
              description="¡Sé el primero en tu comuna en publicar!"
              action={
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Link href="/publicar" className="btn-accent">
                    Publicar disponibilidad
                  </Link>
                  <Link href="/explorar" className="text-sm font-medium text-fuchsia-200 underline-offset-4 hover:text-fuchsia-100 hover:underline">
                    Explorar equipos
                  </Link>
                </div>
              }
            />
          ) : (
            <SuggestedMatchList matches={activeSuggestedMatches} />
          )}
        </section>

        <section className="app-card relative overflow-hidden border-sky-300/25 bg-slate-950/90 p-4 sm:p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="app-eyebrow">Coordinación</p>
              <h2 className="mt-1 text-2xl font-black text-white">Cruces coordinados</h2>
            </div>
            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-sky-300/35 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100">
              {matchedSuggestedMatches.length} cruce{matchedSuggestedMatches.length === 1 ? '' : 's'}
            </span>
          </div>

          {matchedSuggestedMatches.length === 0 ? (
            <EmptyState
              icon="🤝"
              title="Aún no hay cruces coordinados"
              description="Publica hoy y comienza a coordinar amistosos."
              action={
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Link href="/publicar" className="btn-accent">
                    Publicar disponibilidad
                  </Link>
                  <Link href="/explorar" className="text-sm font-medium text-fuchsia-200 underline-offset-4 hover:text-fuchsia-100 hover:underline">
                    Explorar equipos
                  </Link>
                </div>
              }
            />
          ) : (
            <SuggestedMatchList matches={matchedSuggestedMatches} />
          )}
        </section>

        <section className="app-card relative overflow-hidden border-emerald-300/25 bg-slate-950/90 p-4 sm:p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="app-eyebrow">Actividad</p>
              <h2 className="mt-1 text-2xl font-black text-white">Publicaciones</h2>
            </div>
            <Link href="/explorar" className="btn-secondary">
              Ver todas
            </Link>
          </div>

          {openAvailabilities.length === 0 ? (
            <EmptyState
              icon="📣"
              title="Aún no hay publicaciones"
              description="Activa tu zona con la primera publicación."
              action={
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Link href="/publicar" className="btn-accent">
                    Publicar disponibilidad
                  </Link>
                  <Link href="/explorar" className="text-sm font-medium text-fuchsia-200 underline-offset-4 hover:text-fuchsia-100 hover:underline">
                    Explorar equipos
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {openAvailabilities.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          )}
        </section>

        {completedSuggestedMatches.length > 0 ? (
          <section className="app-card relative overflow-hidden border-amber-300/25 bg-slate-950/90 p-4 sm:p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="app-eyebrow">Cierre de partidos</p>
                <h2 className="mt-1 text-2xl font-black text-white">Resultados</h2>
              </div>
              <Link href="/resultados" className="btn-accent">
                Ir a resultados
              </Link>
            </div>
            <SuggestedMatchList matches={completedSuggestedMatches} />
          </section>
        ) : null}

        {(ranking.length > 0 || recentResults.length > 0) ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {ranking.length > 0 ? <HomeRankingPreview teams={ranking} /> : null}
            {recentResults.length > 0 ? <HomeResultsPreview results={recentResults} /> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
