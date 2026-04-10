import Link from 'next/link';
import { getMatchReasons, getMatchTier } from '@/lib/matching';
import type { SuggestedMatchCard } from '@/lib/types';

const categoryLabel: Record<string, string> = {
  'sub-12': 'Sub-12',
  'sub-14': 'Sub-14',
  'sub-16': 'Sub-16',
  'sub-18': 'Sub-18',
  'sub-20': 'Sub-20',
  tc: 'Todo Competidor (TC)'
};

export default function SuggestedMatchCardView({
  match,
  featured = false
}: {
  match: SuggestedMatchCard;
  featured?: boolean;
}) {
  const tier = getMatchTier(match.totalScore);
  const reasons = getMatchReasons(match.a, match.b, match.totalScore).slice(0, featured ? 5 : 4);

  return (
    <article className={`card-panel p-4 ${featured ? 'border-2 border-accent/40 bg-accent/5' : ''}`}>
      <p className="text-xs font-medium text-accent">{tier}</p>
      <h3 className="mt-1 display-serif text-xl text-ink">{match.a.club_name} vs {match.b.club_name}</h3>
      <p className="mt-1 text-sm text-muted">{categoryLabel[match.a.age_category] || match.a.age_category} · Rama {match.a.branch}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
        {[match.a, match.b].map((team) => (
          <div key={team.id} className="rounded-lg border border-line/80 p-2">
            {team.logo_url ? <img src={team.logo_url} alt={`Logo ${team.club_name}`} className="mb-2 h-10 w-10 rounded-full object-cover" /> : null}
            <p className="font-medium text-ink">{team.club_name}</p>
            <p>{team.comuna}</p>
            <p>{team.start_time?.slice(0, 5)} - {team.end_time?.slice(0, 5)}</p>
            <p>{team.has_court ? 'Pone cancha' : 'No pone cancha'}</p>
          </div>
        ))}
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
        {reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <div className="mt-3 flex gap-3 text-sm">
        <Link href={`/publicaciones/${match.a.id}`} className="text-accent hover:underline">Ver publicación A</Link>
        <Link href={`/publicaciones/${match.b.id}`} className="text-accent hover:underline">Ver publicación B</Link>
      </div>
    </article>
  );
}
