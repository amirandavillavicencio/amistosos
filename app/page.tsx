import Link from 'next/link';
import HomeHero from '@/components/home-hero';
import HomeRankingPreview from '@/components/home-ranking-preview';
import HomeResultsPreview from '@/components/home-results-preview';
import PostCard from '@/components/post-card';
import SuggestedMatchList from '@/components/suggested-match-list';
import { rebuildSuggestedMatches } from '@/app/actions';
import { getClubStatsRanking, getOpenAvailabilities, getRecentResults, getSuggestedMatches } from '@/lib/data';
import type { AvailabilityWithTeam, ClubStatsCard, MatchResultRow, SuggestedMatchCard } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await rebuildSuggestedMatches();

  let suggestedMatches: SuggestedMatchCard[] = [];
  let openAvailabilities: AvailabilityWithTeam[] = [];
  let ranking: ClubStatsCard[] = [];
  let recentResults: MatchResultRow[] = [];

  try {
    const [matches, availabilities, topRanking, results] = await Promise.all([
      getSuggestedMatches(6),
      getOpenAvailabilities(9),
      getClubStatsRanking(5),
      getRecentResults(5)
    ]);

    suggestedMatches = Array.isArray(matches) ? matches : [];
    openAvailabilities = Array.isArray(availabilities) ? availabilities : [];
    ranking = Array.isArray(topRanking) ? topRanking : [];
    recentResults = Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('HomePage data load failed', error);
  }

  return (
    <main className="section relative isolate py-7 sm:py-9 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(37,99,235,0.14),transparent_32%)]" />
      <div className="space-y-4 sm:space-y-5">
        <HomeHero suggestedCount={suggestedMatches.length} postCount={openAvailabilities.length} />

        <section className="relative overflow-hidden rounded-3xl border border-violet-300/25 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.75)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-200/80">Matchmaking activo</p>
              <h2 className="text-2xl font-black text-white">Sugerencias reales para coordinar amistosos</h2>
              <p className="mt-1 text-sm text-slate-300">Revisa compatibilidad, confirma el cruce y abre conversación con ambos clubes en minutos.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-violet-300/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                {suggestedMatches.length} match{suggestedMatches.length === 1 ? '' : 'es'} sugerido{suggestedMatches.length === 1 ? '' : 's'}
              </span>
              <Link href="/resultados" className="btn-accent">
                Ver resultados
              </Link>
            </div>
          </div>

          {suggestedMatches.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-7 text-center sm:p-9">
              <p className="text-lg font-semibold text-slate-100">Aún no hay cruces sugeridos</p>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300">
                Publica o actualiza disponibilidades para activar nuevas sugerencias entre clubes con horarios compatibles.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Link href="/publicar" className="btn-accent">
                  Publicar disponibilidad
                </Link>
                <Link href="/explorar" className="btn-secondary">
                  Ver publicaciones activas
                </Link>
              </div>
            </article>
          ) : (
            <SuggestedMatchList matches={suggestedMatches} />
          )}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-emerald-300/25 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.75)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">Publicaciones activas</p>
              <h2 className="text-2xl font-black text-white">Disponibilidades para próximos amistosos</h2>
              <p className="mt-1 text-sm text-slate-300">Menor prioridad que matches sugeridos, pero siempre visibles para encontrar alternativas.</p>
            </div>
            <Link href="/explorar" className="btn-secondary">Ver todas</Link>
          </div>

          {openAvailabilities.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center">
              <p className="text-lg font-semibold text-slate-100">Aún no hay disponibilidades activas</p>
              <p className="mt-2 text-sm text-slate-300">Publica una disponibilidad para empezar a recibir cruces sugeridos.</p>
            </article>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {openAvailabilities.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
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
