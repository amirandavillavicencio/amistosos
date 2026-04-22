import Link from 'next/link';
import HomeHero from '@/components/home-hero';
import HomeRankingPreview from '@/components/home-ranking-preview';
import HomeResultsPreview from '@/components/home-results-preview';
import PostCard from '@/components/post-card';
import SuggestedMatchList from '@/components/suggested-match-list';
import HowItWorks from '@/components/how-it-works';
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
    <main className="section relative isolate py-7 sm:py-9 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(37,99,235,0.14),transparent_32%)]" />
      <div className="space-y-5 sm:space-y-6">
        <HomeHero suggestedCount={activeSuggestedMatches.length} postCount={openAvailabilities.length} />
        <HowItWorks />

        <section className="relative overflow-hidden rounded-3xl border border-violet-300/25 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.75)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Cruces activos</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center whitespace-nowrap rounded-full border border-violet-300/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                {activeSuggestedMatches.length} cruce{activeSuggestedMatches.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {activeSuggestedMatches.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-7 text-center sm:p-9">
              <p className="text-5xl">⚡</p><p className="text-lg font-semibold text-slate-100">Aún no hay cruces activos</p><p className="text-sm text-slate-300">¡Sé el primero en tu comuna en publicar!</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Link href="/publicar" className="btn-accent">
                  Publicar
                </Link>
                <Link href="/explorar" className="btn-secondary">
                  Explorar
                </Link>
              </div>
            </article>
          ) : (
            <SuggestedMatchList matches={activeSuggestedMatches} />
          )}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-sky-300/25 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.75)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Cruces coordinados</h2>
            </div>
            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-sky-300/35 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100">
              {matchedSuggestedMatches.length} cruce{matchedSuggestedMatches.length === 1 ? '' : 's'}
            </span>
          </div>

          {matchedSuggestedMatches.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-7 text-center sm:p-9">
              <p className="text-5xl">🤝</p><p className="text-lg font-semibold text-slate-100">Aún no hay cruces coordinados</p><p className="text-sm text-slate-300">Publica hoy y comienza a coordinar amistosos.</p><div className="mt-4"><Link href="/publicar" className="btn-accent">Publicar ahora</Link></div>
            </article>
          ) : (
            <SuggestedMatchList matches={matchedSuggestedMatches} />
          )}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-emerald-300/25 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.75)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Publicaciones</h2>
            </div>
            <Link href="/explorar" className="btn-secondary">Ver todas</Link>
          </div>

          {openAvailabilities.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center">
              <p className="text-5xl">📣</p><p className="text-lg font-semibold text-slate-100">Aún no hay publicaciones</p><p className="text-sm text-slate-300">Activa tu zona con la primera publicación.</p><div className="mt-4"><Link href="/publicar" className="btn-accent">Publicar ahora</Link></div>
            </article>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {openAvailabilities.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.75)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Resultados</h2>
            </div>
            <Link href="/resultados" className="btn-accent">
              Ir a resultados
            </Link>
          </div>
          {completedSuggestedMatches.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-7 text-center sm:p-9">
              <p className="text-5xl">🏆</p>
              <p className="text-lg font-semibold text-slate-100">Aún no hay resultados</p>
              <p className="text-sm text-slate-300">Cuando se reporten partidos aparecerán aquí.</p>
              <div className="mt-4"><Link href="/publicar" className="btn-accent">Publicar ahora</Link></div>
            </article>
          ) : (
            <SuggestedMatchList matches={completedSuggestedMatches} />
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <HomeRankingPreview teams={ranking} />
          <HomeResultsPreview results={recentResults} />
        </div>
      </div>
    </main>
  );
}
