import SuggestedMatchCardView from '@/components/suggested-match-card';
import type { SuggestedMatchCard } from '@/lib/types';

export default function SuggestedMatchList({ matches }: { matches: SuggestedMatchCard[] }) {
  const hasSingleMatch = matches.length === 1;

  return (
    <div className={hasSingleMatch ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'}>
      {matches.map((match, index) => (
        <SuggestedMatchCardView key={match.id} match={match} featured={index === 0} />
      ))}
    </div>
  );
}
