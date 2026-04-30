import Link from 'next/link';
import type { SuggestedMatchCard } from '@/lib/types';
import SuggestedMatchCardView from '@/components/suggested-match-card';
import { formatPlural } from '@/lib/format';

export default function HomeMatchesSection({ matches }: { matches: SuggestedMatchCard[] }) {
  const featuredMatches = matches.slice(0, 4);

  return (
    <section className="mt-6 rounded-[2rem] border border-[#1f4f98] bg-[#0b2b5e] p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-white sm:text-5xl">Matches disponibles</h2>
          <p className="mt-2 text-sm text-[#d7e6ff]">Partidos sugeridos con día, categoría, rama y horario compatible.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[#ffd447]/50 bg-[#ffd447]/15 px-3 py-1 text-sm font-semibold text-[#ffe58a]">
            {formatPlural(matches.length, 'match', 'matches')}
          </span>
          <Link href="/explorar" className="btn-secondary border-white/40 bg-white text-[#0f3b82] hover:bg-[#f4f8ff]">
            Ver matches disponibles
          </Link>
        </div>
      </div>

      {featuredMatches.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {featuredMatches.map((match, index) => (
            <SuggestedMatchCardView key={match.id} match={match} featured={index === 0} />
          ))}
        </div>
      ) : (
        <article className="rounded-2xl border border-[#2b63b6] bg-[#123a79] p-5 text-[#d7e6ff]">
          No hay matches disponibles por ahora. Publica disponibilidad para aparecer en próximos matches.
        </article>
      )}
    </section>
  );
}
