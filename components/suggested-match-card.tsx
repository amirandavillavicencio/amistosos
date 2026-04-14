import Link from 'next/link';
import { formatTimeLabel, getMatchReasons, getMatchTier } from '@/lib/matching';
import type { SuggestedMatchCard } from '@/lib/types';

const categoryLabel: Record<string, string> = {
  'sub-12': 'Sub-12',
  'sub-14': 'Sub-14',
  'sub-16': 'Sub-16',
  'sub-18': 'Sub-18',
  'sub-20': 'Sub-20',
  tc: 'Todo Competidor (TC)'
};

const branchLabel: Record<string, string> = {
  femenina: 'Femenina',
  masculina: 'Masculina',
  mixta: 'Mixta'
};

function safeText(value: string | null | undefined, fallback: string): string {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function buildTeamViewModel(match: SuggestedMatchCard, side: 'a' | 'b', index: number) {
  const team = match[side];

  return {
    id: team?.id || `${match.id}-${side}-${index}`,
    postId: team?.id || null,
    clubName: safeText(team?.club_name, side === 'a' ? 'Equipo A' : 'Equipo B'),
    comuna: safeText(team?.comuna, 'Comuna no informada'),
    schedule: `${formatTimeLabel(team?.start_time)} - ${formatTimeLabel(team?.end_time)}`,
    courtLabel: team?.has_court ? 'Pone cancha' : 'Cancha no confirmada',
    logoUrl: safeText(team?.logo_url, '')
  };
}

export default function SuggestedMatchCardView({
  match,
  featured = false
}: {
  match: SuggestedMatchCard;
  featured?: boolean;
}) {
  const totalScore = Number.isFinite(match?.totalScore) ? match.totalScore : 0;
  const tier = getMatchTier(totalScore);
  const fallbackReasons = ['Misma rama y categoría', 'Cruce horario real', 'Al menos un equipo tiene cancha'];
  const computedReasons = getMatchReasons(match).filter(Boolean).slice(0, 4);
  const reasons = (computedReasons.length ? computedReasons : fallbackReasons).slice(0, 4);

  const teamA = buildTeamViewModel(match, 'a', 0);
  const teamB = buildTeamViewModel(match, 'b', 1);
  const category = safeText(categoryLabel[match?.ageCategory] || match?.a?.age_category, 'Categoría no informada');
  const branch = safeText(branchLabel[match?.branch] || match?.a?.branch, 'No informada');

  return (
    <article className={`card-panel p-4 ${featured ? 'border-accent/50 bg-accent/5' : ''}`}>
      <p className="text-xs font-medium text-accent">
        {featured ? 'Destacado · ' : ''}
        {tier}
        <span className="ml-2 text-muted">{totalScore}/100</span>
      </p>

      <h3 className="mt-1 display-serif text-xl text-ink">
        {teamA.clubName} vs {teamB.clubName}
      </h3>

      <p className="mt-1 text-sm text-muted">
        {category} · Rama {branch}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
        {[teamA, teamB].map((team) => (
          <div key={team.id} className="rounded-lg border border-line/80 p-2">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={`Logo de ${team.clubName}`}
                className="mb-2 h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-line text-[10px] text-muted">
                Sin logo
              </div>
            )}
            <p className="font-medium text-ink">{team.clubName}</p>
            <p>{team.comuna}</p>
            <p>{team.schedule}</p>
            <p>{team.courtLabel}</p>
          </div>
        ))}
      </div>

      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {teamA.postId ? (
          <Link href={`/publicaciones/${teamA.postId}`} className="text-accent hover:underline">
            Ver publicación de {teamA.clubName}
          </Link>
        ) : (
          <span className="text-muted">Publicación A no disponible</span>
        )}

        {teamB.postId ? (
          <Link href={`/publicaciones/${teamB.postId}`} className="text-accent hover:underline">
            Ver publicación de {teamB.clubName}
          </Link>
        ) : (
          <span className="text-muted">Publicación B no disponible</span>
        )}
      </div>
    </article>
  );
}
