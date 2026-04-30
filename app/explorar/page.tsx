import type { Metadata } from 'next';
import BackHomeLink from '@/components/back-home-link';
import ExplorarFilters from '@/components/explorar-filters';
import { getOpenAvailabilities } from '@/lib/data';
import type { AvailabilityWithTeam } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explorar equipos | Amistosos Vóley',
  description: 'Filtra equipos por comuna, día, categoría, rama y disponibilidad de cancha para coordinar amistosos.'
};

export default async function ExplorarPage() {
  let posts: AvailabilityWithTeam[] = [];

  try {
    posts = await getOpenAvailabilities(120);
  } catch (error) {
    console.error('ExplorarPage data load failed', { route: '/explorar', error });
  }

  return (
    <main className="section py-8">
      <section className="rounded-[2rem] border border-[#1f58ad] bg-[#0f3b82] px-6 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffd447]">Explorar equipos</p>
            <h1 className="mt-2 font-display text-5xl leading-none text-white sm:text-6xl">Disponibilidades abiertas</h1>
            <p className="mt-3 max-w-2xl text-base text-[#dbe8ff]">Filtra por comuna, categoría, rama, días y cancha para encontrar rival.</p>
          </div>
          <BackHomeLink className="border-white/65 bg-white/95 text-[#0f3b82] hover:border-white hover:bg-white" />
        </div>
      </section>

      <section className="mt-6">
        <ExplorarFilters posts={posts} />
      </section>
    </main>
  );
}
