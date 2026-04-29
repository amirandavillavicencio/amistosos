import Link from 'next/link';
import HomeHero from '@/components/home-hero';
import PostCard from '@/components/post-card';
import SuggestedMatchPanel from '@/components/suggested-match-panel';
import HowItWorks from '@/components/how-it-works';
import HomeModules from '@/components/home-modules';
import HomeCTA from '@/components/home-cta';
import { rebuildSuggestedMatches } from '@/app/actions';
import { getOpenAvailabilities, getSuggestedMatches, logHomeProductionDiagnostics } from '@/lib/data';
import type { AvailabilityWithTeam, SuggestedMatchCard } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  await logHomeProductionDiagnostics();
  await rebuildSuggestedMatches();

  let activeSuggestedMatches: SuggestedMatchCard[] = [];
  let openAvailabilities: AvailabilityWithTeam[] = [];

  try {
    const [activeMatches, availabilities] = await Promise.all([getSuggestedMatches(6), getOpenAvailabilities(8)]);
    activeSuggestedMatches = Array.isArray(activeMatches) ? activeMatches : [];
    openAvailabilities = Array.isArray(availabilities) ? availabilities : [];
  } catch (error) {
    console.error('HomePage data load failed', error);
  }

  console.log('[home:suggestedMatches]', {
    count: activeSuggestedMatches?.length ?? 0,
    statuses: activeSuggestedMatches?.map((m) => m.status),
    ids: activeSuggestedMatches?.map((m) => m.id),
  });

  return (
    <main className="section py-8">
      <nav className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#224f9d] bg-[#0f3b82] px-4 py-3 shadow-sm">
        <p className="font-display text-3xl text-white">AMISTOSOS VÓLEY</p>
        <div className="flex items-center gap-2">
          <Link href="/ranking" className="btn-secondary !px-4 !py-2">Ranking</Link>
          <Link href="/explorar" className="btn-secondary !px-4 !py-2">Explorar</Link>
          <Link href="/publicar" className="btn-accent !px-4 !py-2">Publicar equipo</Link>
        </div>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <HomeHero suggestedCount={activeSuggestedMatches.length} postCount={openAvailabilities.length} />
        <SuggestedMatchPanel matches={activeSuggestedMatches} />
      </div>

      <section className="mt-6">
        <HomeModules />
      </section>

      <section className="mt-6 rounded-[2rem] border border-[#c6daf8] bg-[#eaf2ff] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-4xl text-[#0f2f6a]">Publicaciones activas</h2>
          <Link href="/explorar" className="btn-secondary">Explorar equipos</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {openAvailabilities.map((post) => <PostCard key={post.id} post={post} compact />)}
          <article className="rounded-3xl border border-[#c6daf8] bg-white p-5">
            <h3 className="font-display text-3xl text-[#0f2f6a]">¿Tu equipo busca amistoso?</h3>
            <p className="mt-2 text-sm text-[#2d4f88]">Publica tu disponibilidad.</p>
            <Link href="/publicar" className="btn-secondary mt-4">Crear publicación</Link>
          </article>
        </div>
      </section>

      <section className="mt-6"><HowItWorks /></section>
      <section className="mt-6"><HomeCTA /></section>
    </main>
  );
}
