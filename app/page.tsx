import Link from 'next/link';
import HomeHero from '@/components/home-hero';
import HomeMatchesSection from '@/components/home-matches-section';
import PostCard from '@/components/post-card';
import HowItWorks from '@/components/how-it-works';
import HomeModules from '@/components/home-modules';
import HomeCTA from '@/components/home-cta';
import { getCompletedSuggestedMatches, getMatchedSuggestedMatches, getOpenAvailabilities, getSuggestedMatches, logHomeProductionDiagnostics } from '@/lib/data';
import type { AvailabilityWithTeam, SuggestedMatchCard } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const diagnostics = await logHomeProductionDiagnostics();

  let activeSuggestedMatches: SuggestedMatchCard[] = [];
  let matchedSuggestedMatches: SuggestedMatchCard[] = [];
  let completedSuggestedMatches: SuggestedMatchCard[] = [];
  let openAvailabilities: AvailabilityWithTeam[] = [];

  try {
    const [activeMatches, matchedMatches, completedMatches, availabilities] = await Promise.all([
      getSuggestedMatches(8),
      getMatchedSuggestedMatches(8),
      getCompletedSuggestedMatches(8),
      getOpenAvailabilities(8)
    ]);
    activeSuggestedMatches = Array.isArray(activeMatches) ? activeMatches : [];
    matchedSuggestedMatches = Array.isArray(matchedMatches) ? matchedMatches : [];
    completedSuggestedMatches = Array.isArray(completedMatches) ? completedMatches : [];
    openAvailabilities = Array.isArray(availabilities) ? availabilities : [];
  } catch (error) {
    console.error('HomePage data load failed', error);
  }

  if ((diagnostics?.suggestedMatchesCount ?? 0) > 0 && activeSuggestedMatches.length === 0) {
    console.error('[home-error] raw suggested matches exist but getSuggestedMatches returned 0');
  }

  return (
    <main className="section py-6 sm:py-8">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.45rem] border border-white/10 bg-[#0a2447] px-4 py-3 shadow-[0_14px_34px_rgba(10,36,71,0.22)] sm:px-5">
        <Link href="/" className="font-display text-3xl uppercase tracking-wide text-white">
          AMISTOSOS VÓLEY
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ranking" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
            Ranking
          </Link>
          <Link href="/explorar" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
            Explorar
          </Link>
          <Link href="/publicar" className="rounded-xl bg-[#ffd447] px-4 py-2 text-sm font-bold text-[#0a2447] shadow-[0_6px_18px_rgba(255,212,71,0.34)] transition hover:bg-[#ffe06b]">
            Publicar equipo
          </Link>
        </div>
      </nav>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <HomeHero suggestedCount={activeSuggestedMatches.length} postCount={openAvailabilities.length} />

        <aside className="rounded-[1.75rem] border border-[#dce9fd] bg-white p-5 shadow-[0_10px_28px_rgba(10,36,71,0.07)] sm:p-6">
          <p className="inline-flex rounded-lg border border-[#dce9fd] bg-[#f3f8ff] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#1042a0]">
            Cómo funciona
          </p>
          <h2 className="mt-4 font-display text-4xl uppercase leading-[0.9] text-[#0a2447]">
            Publica y confirma
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5a7bb5]">
            Publica disponibilidad, guarda tu código privado y confirma cuando el sistema encuentre un match compatible.
          </p>

          <div className="mt-5 grid gap-2.5">
            <Step number="1" text="Publica días, horario, rama y categoría." />
            <Step number="2" text="El sistema crea matches compatibles automáticamente." />
            <Step number="3" text="Cada equipo confirma con su código privado." />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/publicar" className="rounded-xl bg-[#ffd447] px-4 py-2.5 text-sm font-bold text-[#0a2447] shadow-[0_6px_18px_rgba(255,212,71,0.3)] transition hover:bg-[#ffe06b]">
              Publicar equipo
            </Link>
            <Link href="/explorar" className="rounded-xl border border-[#c0d4f5] bg-white px-4 py-2.5 text-sm font-semibold text-[#1042a0] transition hover:bg-[#f3f8ff]">
              Ver todos
            </Link>
          </div>
        </aside>
      </section>

      <HomeMatchesSection activeMatches={activeSuggestedMatches} matchedMatches={matchedSuggestedMatches} completedMatches={completedSuggestedMatches} />

      <section className="mt-4 rounded-[1.75rem] border border-[#c6daf8] bg-[#eaf2ff] p-4 shadow-[0_10px_28px_rgba(10,36,71,0.05)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a55c8]">Equipos buscando amistoso</p>
            <h2 className="font-display text-4xl uppercase leading-none text-[#0f2f6a]">Publicaciones activas</h2>
          </div>
          <Link href="/explorar" className="rounded-xl border border-[#c0d4f5] bg-white px-4 py-2 text-sm font-semibold text-[#1042a0] transition hover:bg-[#f3f8ff]">
            Explorar equipos
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {openAvailabilities.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
          <article className="rounded-3xl border border-[#c6daf8] bg-white p-5">
            <h3 className="font-display text-3xl leading-none text-[#0f2f6a]">¿Tu equipo busca amistoso?</h3>
            <p className="mt-2 text-sm text-[#2d4f88]">Publica tu disponibilidad y guarda tu código para confirmar matches.</p>
            <Link href="/publicar" className="btn-secondary mt-4">Crear publicación</Link>
          </article>
        </div>
      </section>

      <section className="mt-4"><HomeModules /></section>
      <section className="mt-4"><HowItWorks /></section>
      <section className="mt-4"><HomeCTA /></section>
    </main>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#dce9fd] bg-[#f8fbff] p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a2447] text-xs font-black text-white">
        {number}
      </span>
      <p className="text-sm leading-snug text-[#0d2750]">{text}</p>
    </div>
  );
}
