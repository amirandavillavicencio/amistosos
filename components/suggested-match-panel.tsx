import Link from 'next/link';
import type { SuggestedMatchCard } from '@/lib/types';
import { formatBranch, formatCategory, formatComuna, getInitials, hasValidImageUrl } from '@/lib/presentation';
import { formatWeekdayLabel, toMinutes } from '@/lib/matching';
import TeamContact from '@/components/team-contact';

function formatTimeRange(start: string | null | undefined, end: string | null | undefined) {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a === null || b === null || b <= a) return null;
  const h = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
  return `${h(a)} - ${h(b)}`;
}

function sharedTime(match: SuggestedMatchCard) {
  const aStart = toMinutes(match.a?.start_time);
  const aEnd = toMinutes(match.a?.end_time);
  const bStart = toMinutes(match.b?.start_time);
  const bEnd = toMinutes(match.b?.end_time);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return 'Horario por confirmar';
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  if (end <= start) return 'Horario por confirmar';
  const h = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
  return `${h(start)} - ${h(end)}`;
}

function teamStatus(match: SuggestedMatchCard) {
  if (match.status === 'matched') return 'Cruce confirmado';
  if (match.status === 'pending') return 'Falta la confirmación del otro equipo';
  return null;
}

export default function SuggestedMatchPanel({ match }: { match?: SuggestedMatchCard }) {
  if (!match) {
    return (
      <aside className="rounded-[2rem] border border-[#ddcdbf] bg-[#fffaf3] p-5">
        <h2 className="font-display text-2xl text-[#3f2d1f]">Cruce disponible</h2>
        <p className="mt-3 text-sm text-[#6b5a4c]">No hay cruces disponibles por ahora.</p>
        <p className="mt-1 text-sm text-[#6b5a4c]">Publica tu disponibilidad o revisa los equipos activos.</p>
      </aside>
    );
  }

  const status = teamStatus(match);
  const commonDay = match.sharedWeekdays.length ? formatWeekdayLabel(match.sharedWeekdays[0]) : 'Por confirmar';
  const cancha = match.a?.has_court ? `${match.a.club_name} tiene cancha` : match.b?.has_court ? `${match.b.club_name} tiene cancha` : 'Cancha por confirmar';

  return (
    <aside className={`rounded-[2rem] border bg-[#fffaf3] p-5 ${match.status === 'matched' ? 'border-[#9aae7a]' : 'border-[#ddcdbf]'}`}>
      <h2 className="font-display text-2xl text-[#3f2d1f]">Cruce disponible</h2>
      <p className="mt-2 text-sm font-semibold text-[#6b5a4c]">{match.a.club_name} vs {match.b.club_name}</p>

      <div className="mt-4 grid gap-3">
        <TeamBox team={match.a} />
        <TeamBox team={match.b} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-[#4f3f31]">
        <Data label="Día común" value={commonDay} />
        <Data label="Horario" value={sharedTime(match)} />
        <Data label="Categoría" value={formatCategory(match.ageCategory || match.a?.age_category)} />
        <Data label="Rama" value={formatBranch(match.branch || match.a?.branch)} />
        <Data label="Cancha" value={cancha} className="col-span-2" />
      </dl>

      {status ? <p className="mt-3 rounded-xl bg-[#f2eadf] px-3 py-2 text-sm text-[#5f4d3e]">{status}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/matches/aceptar?matchId=${encodeURIComponent(String(match.id))}`} className="btn-accent">Confirmar cruce</Link>
        <Link href={`/publicaciones/${match.a.id}`} className="btn-secondary">Ver detalle</Link>
      </div>
    </aside>
  );
}

function TeamBox({ team }: { team: SuggestedMatchCard['a'] }) {
  const name = team?.club_name || 'Equipo';
  const time = formatTimeRange(team?.start_time, team?.end_time) || 'Horario por confirmar';
  return (
    <article className="rounded-2xl border border-[#e2d5c8] bg-[#f9f1e8] p-3">
      <div className="flex items-center gap-3">
        {hasValidImageUrl(team?.logo_url) ? <img src={team.logo_url!} alt={`Logo de ${name}`} className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dbc4b2] text-xs font-semibold text-[#4a382b]">{getInitials(name)}</div>}
        <div>
          <p className="text-sm font-semibold text-[#3f2d1f]">{name}</p>
          <p className="text-xs text-[#6b5a4c]">{formatComuna(team?.comuna)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-[#6b5a4c]">{formatCategory(team?.age_category)} · {formatBranch(team?.branch)} · {team?.has_court ? 'Tiene cancha' : 'Busca cancha'} · {time}</p>
      <TeamContact instagram={team?.instagram} phone={team?.phone} className="mt-2 text-xs text-[#6b5a4c]" labelClassName="font-semibold text-[#4f3f31]" />
    </article>
  );
}

function Data({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return <div className={className}><dt className="text-xs text-[#7b6757]">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}
