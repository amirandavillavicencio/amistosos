import type { AvailabilityRow } from '@/lib/types';
import { formatWeekdayLabel, formatTimeLabel, resolveWeekdays } from '@/lib/matching';
import TeamContact from '@/components/team-contact';

interface SwipeCardProps {
  post: AvailabilityRow | null;
}

function getScheduleLabel(post: AvailabilityRow) {
  const days = resolveWeekdays(post);
  const dayLabel = days.length > 0 ? formatWeekdayLabel(days[0]) : 'Por definir';
  return `${dayLabel} · ${formatTimeLabel(post.start_time)}-${formatTimeLabel(post.end_time)}`;
}

export default function SwipeCard({ post }: SwipeCardProps) {
  if (!post) {
    return (
      <article className="w-full rounded-3xl bg-slate-100 p-8 text-center shadow-xl shadow-black/10">
        <p className="text-lg font-semibold text-slate-800">No hay más equipos por ahora</p>
        <p className="mt-2 text-sm text-slate-600">Vuelve en unos minutos para seguir buscando amistosos.</p>
      </article>
    );
  }

  return (
    <article className="w-full rounded-3xl bg-slate-100 p-6 shadow-xl shadow-black/10 sm:p-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Equipo disponible</p>
        <h1 className="text-2xl font-semibold text-slate-900">{post.club_name}</h1>
      </div>

      <div className="mt-6 grid gap-4 text-slate-700">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Comuna</p>
          <p className="text-lg font-semibold">{post.comuna}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Nivel</p>
          <p className="text-lg font-semibold capitalize">{post.level || 'No informado'}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Horario</p>
          <p className="text-lg font-semibold">{getScheduleLabel(post)}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Cancha</p>
          <p className="text-lg font-semibold">{post.has_court ? 'Tiene cancha' : 'Busca cancha'}</p>
        </div>
      </div>

      <TeamContact
        instagram={post.instagram}
        phone={post.phone}
        className="mt-4 space-y-1 text-sm text-slate-700"
        labelClassName="font-semibold text-slate-900"
        valueClassName="text-indigo-700 hover:underline"
      />
    </article>
  );
}
