import Link from 'next/link';
import type { SuggestedMatchCard } from '@/lib/types';
import { formatWeekdayLabel, toMinutes } from '@/lib/matching';
import TeamContact from '@/components/team-contact';
import MatchStreamForm from '@/components/match-stream-form';

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
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('') || 'EQ'
  );
}

function formatSchedule(start: string | null | undefined, end: string | null | undefined): string {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return 'Horario por confirmar';
  }

  const toLabel = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  return `${toLabel(startMinutes)} - ${toLabel(endMinutes)}`;
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
    scheduleLabel: formatSchedule(team?.start_time, team?.end_time)
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

function TeamCard({
  team
}: {
  team: ReturnType<typeof buildTeamViewModel>;
}) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
      <div className="flex items-center gap-4">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={`Logo de ${team.clubName}`} className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-300/20" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-100 ring-2 ring-violet-300/25">
            {team.initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xl font-bold text-white">{team.clubName}</p>
          <p className="mt-0.5 text-sm text-slate-300">{team.comuna}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100">{team.category}</span>
        <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100">{team.branch}</span>
        <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-100">{team.courtLabel}</span>
      </div>

      <p className="mt-4 text-sm text-slate-200">{team.scheduleLabel}</p>
      {team.instagram ? (
        <TeamContact
          instagram={team.instagram}
          phone={null}
          className="mt-2"
          labelClassName="font-semibold text-slate-100"
          valueClassName="text-violet-200 hover:underline"
        />
      ) : null}
    </section>
  );
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
  const isConfirmedMatch = match.status === 'matched';
  const matchBadge = isConfirmedMatch ? 'Cruce confirmado' : 'Cruce disponible';
  const wrapperClass = isConfirmedMatch
    ? 'border-[#ef8b6d] bg-white shadow-[0_0_0_1px_rgba(239,139,109,0.35),0_14px_35px_rgba(190,40,40,0.22)]'
    : 'border-[#f4c24d] bg-white shadow-[0_0_0_1px_rgba(244,194,77,0.45),0_14px_35px_rgba(223,170,28,0.2)]';

  return (
    <article className={`card-panel w-full p-5 sm:p-7 ${wrapperClass} ${featured ? 'ring-1 ring-white/60' : ''}`}>
      <header className="mb-6">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isConfirmedMatch ? 'bg-[#ffe3d9] text-[#842f1e]' : 'bg-[#fff4cf] text-[#7e5a00]'}`}>{matchBadge}</span>
        <p className="mt-2 text-sm text-slate-700">Coinciden en día, horario y categoría</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <TeamCard team={teamA} />

        <div className="mx-auto flex items-center justify-center self-center rounded-full border border-violet-300/35 bg-violet-500/20 px-4 py-2 text-sm font-bold tracking-wide text-violet-100">
          VS
        </div>

        <TeamCard team={teamB} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[['Día en común', firstSharedDay], ['Horario', sharedSchedule], ['Categoría', category], ['Rama', branch], ['Cancha', courtDetail]].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {isConfirmedMatch ? (
        <section className="mt-4 rounded-2xl border border-[#ffd9d0] bg-[#fff8f7] p-4">
          <p className="text-sm font-semibold text-[#7f2819]">Información práctica</p>
          <p className="mt-1 text-sm text-slate-700">Lugar: {match.a?.has_court ? `${teamA.clubName}` : match.b?.has_court ? `${teamB.clubName}` : 'Lugar por confirmar'}</p>
          <p className="text-sm text-slate-700">Comuna: {teamA.comuna}</p>
          <p className="text-sm text-slate-700">Día: {firstSharedDay}</p>
          <p className="text-sm text-slate-700">Hora: {sharedSchedule || 'Horario por confirmar'}</p>
          <p className="text-sm text-slate-700">Cancha: {courtDetail}</p>
          {match.streamUrl ? <a href={match.streamUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-[#0f3b82] underline">Ver transmisión</a> : null}
          <MatchStreamForm matchId={suggestedMatchId} />
        </section>
      ) : null}
      <footer className="mt-6 flex flex-wrap gap-3">
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
