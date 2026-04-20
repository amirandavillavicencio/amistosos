import Link from 'next/link';
import { formatTimeLabel, formatWeekdayList, getMatchReasons, getMatchTier } from '@/lib/matching';
import type { SuggestedMatchCard } from '@/lib/types';
import TeamContact from '@/components/team-contact';

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
    logoUrl: safeText(team?.logo_url, ''),
    instagram: team?.instagram || null,
    phone: team?.phone || null
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
  const availabilitySummary = match.sharedWeekdays.length
    ? `${formatWeekdayList(match.sharedWeekdays)} · ${teamA.schedule} / ${teamB.schedule}`
    : `${teamA.schedule} / ${teamB.schedule}`;

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
      <p className="mt-1 text-xs text-muted">Disponibilidad: {availabilitySummary}</p>

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
            <TeamContact
              instagram={team.instagram}
              phone={team.phone}
              className="mt-1 space-y-1 text-xs text-muted"
              labelClassName="font-medium text-ink"
              valueClassName="text-accent hover:underline"
            />
          </div>
        ))}
      </div>

      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {teamA.postId ? (
          <Link href={`/publicaciones/${teamA.postId}`} className="btn-secondary text-xs">
            Ver detalle
          </Link>
        ) : null}
        <Link
          href={`/resultados?club_name=${encodeURIComponent(teamA.clubName)}&opponent_name=${encodeURIComponent(teamB.clubName)}`}
          className="btn-accent text-xs"
        >
          Cargar resultado
        </Link>
      </div>
    </article>
  );
}
