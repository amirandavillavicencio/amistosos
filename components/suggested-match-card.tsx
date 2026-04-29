import Link from 'next/link';
import type { SuggestedMatchCard } from '@/lib/types';
import { formatTimeLabel, formatWeekdayLabel, toMinutes } from '@/lib/matching';
import TeamContact from '@/components/team-contact';

const categoryLabel: Record<string, string> = {
  'sub-12': 'Sub-12',
  'sub-14': 'Sub-14',
  'sub-16': 'Sub-16',
  'sub-18': 'Sub-18',
  'sub-20': 'Sub-20',
  tc: 'Todo Competidor'
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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || 'EQ';
}

function buildTeamViewModel(match: SuggestedMatchCard, side: 'a' | 'b', index: number) {
  const team = match[side];
  const clubName = safeText(team?.club_name, side === 'a' ? 'Equipo A' : 'Equipo B');

  return {
    id: team?.id || `${match.id}-${side}-${index}`,
    postId: team?.id || null,
    clubName,
    comuna: safeText(team?.comuna, 'Comuna no informada'),
    category: safeText(categoryLabel[team?.age_category || ''], 'Categoría no informada'),
    branch: safeText(branchLabel[team?.branch || ''], 'Rama no informada'),
    courtLabel: team?.has_court ? 'Tiene cancha' : 'Busca cancha',
    hasCourt: Boolean(team?.has_court),
    logoUrl: safeText(team?.logo_url, ''),
    initials: getInitials(clubName),
    instagram: team?.instagram || null,
    phone: team?.phone || null,
    startTime: team?.start_time,
    endTime: team?.end_time
  };
}

function getSharedScheduleLabel(match: SuggestedMatchCard): string {
  const aStart = toMinutes(match?.a?.start_time);
  const aEnd = toMinutes(match?.a?.end_time);
  const bStart = toMinutes(match?.b?.start_time);
  const bEnd = toMinutes(match?.b?.end_time);

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return 'Horario por confirmar';
  }

  const overlapStart = Math.max(aStart, bStart);
  const overlapEnd = Math.min(aEnd, bEnd);

  if (overlapEnd <= overlapStart) {
    return 'Horario por confirmar';
  }

  const toLabel = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  return `${toLabel(overlapStart)} - ${toLabel(overlapEnd)}`;
}

export default function SuggestedMatchCardView({
  match,
  featured = false
}: {
  match: SuggestedMatchCard;
  featured?: boolean;
}) {
  const teamA = buildTeamViewModel(match, 'a', 0);
  const teamB = buildTeamViewModel(match, 'b', 1);
  const category = safeText(categoryLabel[match?.ageCategory] || match?.a?.age_category, 'Categoría no informada');
  const branch = safeText(branchLabel[match?.branch] || match?.a?.branch, 'No informada');
  const firstSharedDay = match.sharedWeekdays.length ? formatWeekdayLabel(match.sharedWeekdays[0]) : 'Por confirmar';
  const sharedSchedule = getSharedScheduleLabel(match);
  const courtDetail = teamA.hasCourt
    ? `${teamA.clubName} tiene cancha`
    : teamB.hasCourt
      ? `${teamB.clubName} tiene cancha`
      : 'Cancha por confirmar';
  const suggestedMatchId = String(match?.id || '').trim();
  const hasSuggestedMatchId = Boolean(suggestedMatchId) && !suggestedMatchId.includes('::');
  const isActiveSuggestedMatch = match.status === 'active';

  return (
    <article
      className={`card-panel w-full p-4 sm:p-6 ${featured ? 'border-accent/70 bg-panel shadow-[0_14px_34px_rgba(15,23,42,0.45)]' : ''}`}
    >
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Cruce sugerido</p>
        <h3 className="mt-1 text-2xl font-extrabold text-white">{teamA.clubName} vs {teamB.clubName}</h3>
        <p className="mt-1 text-sm text-slate-200">Coinciden en día, horario y categoría</p>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        {[teamA].map((team) => (
          <section key={team.id} className="rounded-2xl border border-line bg-slate-900/70 p-4">
            <div className="flex items-center gap-3">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={`Logo de ${team.clubName}`} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/25 text-sm font-bold text-white">
                  {team.initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">{team.clubName}</p>
                <p className="text-sm text-slate-300">{team.comuna}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-100">{team.category}</span>
              <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-100">{team.branch}</span>
              <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-100">{team.courtLabel}</span>
            </div>

            <div className="mt-3 text-xs text-slate-200">
              <p>
                Horario: {formatTimeLabel(team.startTime)} - {formatTimeLabel(team.endTime)}
              </p>
              {team.instagram ? (
                <TeamContact
                  instagram={team.instagram}
                  phone={null}
                  className="mt-1"
                  labelClassName="font-semibold text-slate-100"
                  valueClassName="text-violet-200 hover:underline"
                />
              ) : null}
            </div>
          </section>
        ))}

        <div className="mx-auto flex items-center justify-center rounded-full border border-violet-300/50 bg-violet-500/20 px-4 py-2 text-sm font-bold text-violet-100 md:h-fit md:self-center">
          VS
        </div>

        {[teamB].map((team) => (
          <section key={team.id} className="rounded-2xl border border-line bg-slate-900/70 p-4">
            <div className="flex items-center gap-3">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={`Logo de ${team.clubName}`} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/25 text-sm font-bold text-white">
                  {team.initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">{team.clubName}</p>
                <p className="text-sm text-slate-300">{team.comuna}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-100">{team.category}</span>
              <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-100">{team.branch}</span>
              <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-100">{team.courtLabel}</span>
            </div>

            <div className="mt-3 text-xs text-slate-200">
              <p>
                Horario: {formatTimeLabel(team.startTime)} - {formatTimeLabel(team.endTime)}
              </p>
              {team.instagram ? (
                <TeamContact
                  instagram={team.instagram}
                  phone={null}
                  className="mt-1"
                  labelClassName="font-semibold text-slate-100"
                  valueClassName="text-violet-200 hover:underline"
                />
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-slate-900/60 p-4">
        <div className="grid gap-2 text-sm text-slate-100 sm:grid-cols-2 lg:grid-cols-5">
          <p><span className="font-semibold text-white">Día:</span> {firstSharedDay}</p>
          <p><span className="font-semibold text-white">Horario:</span> {sharedSchedule}</p>
          <p><span className="font-semibold text-white">Categoría:</span> {category}</p>
          <p><span className="font-semibold text-white">Rama:</span> {branch}</p>
          <p><span className="font-semibold text-white">Cancha:</span> {courtDetail}</p>
        </div>
      </div>

      <footer className="mt-5 flex flex-wrap gap-3">
        {teamA.postId && teamB.postId && hasSuggestedMatchId && isActiveSuggestedMatch ? (
          <Link href={`/matches/aceptar?matchId=${encodeURIComponent(suggestedMatchId)}`} className="btn-accent text-sm">
            Confirmar cruce
          </Link>
        ) : null}
        {teamA.postId ? (
          <Link href={`/publicaciones/${teamA.postId}`} className="btn-secondary text-sm">
            Ver detalle
          </Link>
        ) : null}
      </footer>
    </article>
  );
}
