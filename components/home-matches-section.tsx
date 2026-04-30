import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AvailabilityWithTeam, SuggestedMatchCard } from '@/lib/types';
import { formatBranch, formatCategory, formatComuna, getInitials, hasValidImageUrl } from '@/lib/presentation';
import { formatWeekdayLabel } from '@/lib/matching';

function timeToMinutes(value: string | null | undefined): number | null {
  const clean = String(value ?? '').trim();
  const match = clean.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');

  return `${hours}:${mins}`;
}

function sharedTime(match: SuggestedMatchCard): string {
  const aStart = timeToMinutes(match.a?.start_time);
  const aEnd = timeToMinutes(match.a?.end_time);
  const bStart = timeToMinutes(match.b?.start_time);
  const bEnd = timeToMinutes(match.b?.end_time);

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return 'Horario por confirmar';
  }

  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);

  if (end <= start) return 'Horario por confirmar';

  return `${minutesToLabel(start)} – ${minutesToLabel(end)}`;
}

function matchDay(match: SuggestedMatchCard): string {
  const first = match.sharedWeekdays?.[0];

  if (first) return formatWeekdayLabel(first);

  const weekdayA = String(match.a?.weekday ?? '').trim();
  const weekdayB = String(match.b?.weekday ?? '').trim();

  if (weekdayA && weekdayA === weekdayB) {
    return formatWeekdayLabel(weekdayA);
  }

  return 'Por confirmar';
}

function courtText(match: SuggestedMatchCard): string {
  if (match.a?.has_court && match.b?.has_court) return 'Ambos tienen';
  if (match.a?.has_court) return match.a.club_name || 'Equipo A';
  if (match.b?.has_court) return match.b.club_name || 'Equipo B';

  return 'Por confirmar';
}

function compactCategory(value: string | null | undefined): string {
  const clean = String(value ?? '').trim().toLowerCase();

  if (clean === 'tc') return 'TC';
  if (clean.startsWith('sub-')) return clean.replace('sub-', 'Sub-');

  return formatCategory(value);
}

function statusLabel(status: SuggestedMatchCard['status']): string {
  if (status === 'matched') return 'Match confirmado';
  if (status === 'unconfirmed') return 'Confirmación pendiente';
  if (status === 'completed') return 'Match jugado';

  return 'Match disponible';
}

function confirmationState(match: SuggestedMatchCard) {
  const teamAConfirmed = Boolean(match.confirmedByAAt);
  const teamBConfirmed = Boolean(match.confirmedByBAt);
  const bothConfirmed = teamAConfirmed && teamBConfirmed;
  const isMatched = match.status === 'matched' || bothConfirmed;
  const isCompleted = match.status === 'completed';
  const statusVariant = isCompleted ? 'completed' : isMatched ? 'matched' : 'active';
  return { teamAConfirmed, teamBConfirmed, bothConfirmed, isMatched, isCompleted, statusVariant };
}

export default function HomeMatchesSection({ activeMatches, matchedMatches, completedMatches }: { activeMatches: SuggestedMatchCard[]; matchedMatches: SuggestedMatchCard[]; completedMatches: SuggestedMatchCard[] }) {
  const visibleMatches = [...activeMatches.slice(0, 4), ...matchedMatches.slice(0, 4), ...completedMatches.slice(0, 2)];
  const total = visibleMatches.length;
  const label = total === 1 ? '1 match' : `${total} matches`;

  return (
    <section className="mt-4 rounded-[28px] border border-[#dce9fd] bg-white p-5 shadow-[0_12px_36px_rgba(10,36,71,0.07)] sm:p-6">
      <header className="mb-5 flex flex-col gap-4 border-b border-[#dce9fd] pb-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[2.65rem] uppercase leading-[0.9] tracking-tight text-[#0a2447] sm:text-[3.1rem]">
              Matches del sistema
            </h2>

            <span className="inline-flex items-center rounded-lg bg-[#2b6bea] px-3 py-1 text-xs font-bold text-white">
              {label}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-[#5a7bb5]">
            Activos para coordinar, confirmados por ambos equipos y resultados completados.
          </p>
        </div>

        <Link
          href="/explorar"
          className="inline-flex w-fit items-center rounded-xl border border-[#c0d4f5] bg-white px-4 py-2.5 text-sm font-semibold text-[#1042a0] transition hover:border-[#1a55c8] hover:bg-[#f3f8ff]"
        >
          Ver todos →
        </Link>
      </header>

      {visibleMatches.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-[#c0d4f5] bg-[#f3f8ff] p-6 text-center">
          <p className="font-display text-3xl uppercase leading-none text-[#0a2447]">
            No hay matches disponibles por ahora
          </p>

          <p className="mx-auto mt-2 max-w-xl text-sm text-[#5a7bb5]">
            Publica una disponibilidad o revisa los equipos activos para encontrar rivales compatibles.
          </p>

          <div className="mt-4 flex justify-center">
            <Link
              href="/publicar"
              className="inline-flex items-center rounded-xl bg-[#f9c900] px-4 py-2.5 text-sm font-bold text-[#0a2447] shadow-[0_4px_14px_rgba(249,201,0,0.35)] transition hover:bg-[#ffd114]"
            >
              Publicar equipo
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function MatchCard({ match }: { match: SuggestedMatchCard }) {
  const isActive = match.status === 'active';
  const { isMatched, isCompleted, statusVariant } = confirmationState(match);

  const teamAName = match.a?.club_name || 'Equipo A';
  const teamBName = match.b?.club_name || 'Equipo B';
  const score = Math.round(Number(match.totalScore || 0));

  return (
    <article className={`relative flex min-w-0 flex-col justify-between rounded-[22px] border-[1.5px] bg-[#f3f8ff] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(10,36,71,0.12)] ${statusVariant === 'matched' ? 'border-transparent bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 shadow-[0_0_0_1px_rgba(5,150,105,0.45),0_0_0_5px_rgba(56,189,248,0.1),0_16px_40px_rgba(16,185,129,0.16)]' : statusVariant === 'completed' ? 'border-[#b8cadf]' : 'border-[#c0d4f5] hover:border-[#1a55c8]'}`}>
      <div>
        <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={`inline-flex rounded-lg px-3 py-1 text-[11.5px] font-bold ${
                statusVariant === 'matched' ? 'bg-[#dff7ea] text-[#14633f]' : statusVariant === 'completed' ? 'bg-[#e9eef5] text-[#37526f]' : 'bg-[#fff4cc] text-[#7a5500]'
              }`}
            >
              {statusVariant === 'matched' ? '✅ Confirmado' : statusLabel(match.status)}
            </span>
            {statusVariant === 'matched' ? <span className="ml-2 inline-flex rounded-full border border-emerald-300/80 bg-white/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">🔥</span> : null}

            <h3 className="mt-3 font-display text-[1.45rem] font-black uppercase leading-[1.05] tracking-tight text-[#0a2447] sm:text-[1.65rem]">
              {teamAName}
              <br />
              <span className="text-[#2b6bea]">vs</span> {teamBName}
            </h3>
          </div>

          <span className="shrink-0 rounded-[10px] bg-[#0a2447] px-3 py-2 text-[13px] font-black tracking-wide text-[#f9c900]">
            {score} pts
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] sm:items-stretch">
          <TeamMiniCard team={match.a} />

          <div className="flex items-center justify-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2b6bea] font-display text-[13px] font-black tracking-wider text-white shadow-[0_4px_14px_rgba(43,107,234,0.35)]">
              VS
            </span>
          </div>

          <TeamMiniCard team={match.b} />
        </div>

        <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-4">
          <Meta label="Día común" value={matchDay(match)} />
          <Meta label="Horario" value={sharedTime(match)} />
          <Meta label="Categoría" value={compactCategory(match.ageCategory || match.a?.age_category)} />
          <Meta label="Cancha" value={courtText(match)} />
        </div>
      </div>

      {isMatched ? <p className="mt-3 text-xs font-semibold text-emerald-700">Ambos equipos confirmaron su participación.</p> : null}
      {isCompleted ? <p className="mt-3 text-xs font-semibold text-slate-600">Partido finalizado.</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isActive ? (
          <Link
            href={`/matches/aceptar?matchId=${encodeURIComponent(String(match.id))}`}
            className="inline-flex items-center rounded-xl bg-[#f9c900] px-4 py-2.5 text-sm font-bold text-[#0a2447] shadow-[0_4px_14px_rgba(249,201,0,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffd114] hover:shadow-[0_6px_20px_rgba(249,201,0,0.4)]"
          >
            Confirmar match
          </Link>
        ) : null}

        <Link
          href={`/publicaciones/${match.a.id}`}
          className="inline-flex items-center rounded-xl border border-[#c0d4f5] bg-white px-4 py-2.5 text-sm font-semibold text-[#1042a0] transition hover:-translate-y-0.5 hover:border-[#1a55c8] hover:bg-[#f3f8ff]"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}

function TeamMiniCard({ team }: { team: AvailabilityWithTeam }) {
  const name = team?.club_name || 'Equipo';

  return (
    <div className="min-w-0 rounded-2xl border border-[#dce9fd] bg-white p-3.5 transition hover:border-[#c0d4f5]">
      <div className="flex min-w-0 items-center gap-2.5">
        {hasValidImageUrl(team?.logo_url) ? (
          <img
            src={team.logo_url!}
            alt={`Logo de ${name}`}
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1042a0] font-display text-sm font-black tracking-wide text-white">
            {getInitials(name)}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-tight text-[#0a2447]">{name}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-[#5a7bb5]">{formatComuna(team?.comuna)}</p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
        <Pill>{compactCategory(team?.age_category)}</Pill>
        <Pill>{formatBranch(team?.branch)}</Pill>
        <Pill tone={team?.has_court ? 'green' : 'orange'}>
          {team?.has_court ? 'Tiene cancha' : 'Busca cancha'}
        </Pill>
      </div>
    </div>
  );
}

function Pill({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'orange' }) {
  const className =
    tone === 'green'
      ? 'border-[#9fd4ba] bg-[#e2f5ec] text-[#1a7045]'
      : tone === 'orange'
        ? 'border-[#f5d080] bg-[#fff4cc] text-[#7a5500]'
        : 'border-[#c6d9f7] bg-[#e8f0fb] text-[#1042a0]';

  return (
    <span className={`max-w-full truncate rounded-md border px-2 py-1 text-[11px] font-bold tracking-[0.03em] ${className}`}>
      {children}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#dce9fd] bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#5a7bb5]">{label}</p>
      <p className="mt-1 break-words text-[13px] font-bold leading-snug text-[#0a2447]">{value}</p>
    </div>
  );
}
