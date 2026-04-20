import SuggestedMatchCardView from '@/components/suggested-match-card';
import type { SuggestedMatchCard } from '@/lib/types';

export default function SuggestedMatchList({ matches }: { matches: SuggestedMatchCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {matches.map((match, index) => (
        <SuggestedMatchCardView key={match.id} match={match} featured={index === 0} />
      ))}
    </div>
  );
}
