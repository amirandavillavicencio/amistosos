import type { AvailabilityWithTeam } from '@/lib/types';

interface PostCardProps {
  post: AvailabilityWithTeam;
}

const categoryLabel: Record<AvailabilityWithTeam['age_category'], string> = {
  'sub-12': 'Sub-12',
  'sub-14': 'Sub-14',
  'sub-16': 'Sub-16',
  'sub-18': 'Sub-18',
  'sub-20': 'Sub-20',
  tc: 'Todo Competidor (TC)'
};

export default function PostCard({ post }: PostCardProps) {
  const startTime = post.start_time?.slice(0, 5) || '--:--';
  const endTime = post.end_time?.slice(0, 5) || '--:--';
  const weekdays = Array.isArray(post?.weekdays) ? post.weekdays : post?.weekday ? [post.weekday] : [];
  const days = weekdays.filter(Boolean).join(', ');

  const availability = post as AvailabilityWithTeam & {
    club_name?: string | null;
    level?: string | null;
  };

  return (
    <article className="card-panel p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(77,56,36,0.14)] sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="display-serif break-words text-xl font-semibold text-ink sm:text-2xl">
            {availability.club_name || 'Equipo sin nombre'}
          </h3>
          <p className="text-xs text-muted">
            {post.comuna} · {categoryLabel[post.age_category]} · {post.branch}
          </p>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {availability.level || post.level}
        </span>
      </div>
      <ul className="space-y-2 text-sm text-muted">
        <li>
          <strong className="text-ink">Horario:</strong> {startTime} - {endTime}
        </li>
        <li>
          <strong className="text-ink">Días:</strong> {days || 'Sin días informados'}
        </li>
        <li>
          <strong className="text-ink">Cancha:</strong> {post.has_court ? 'Sí pone cancha' : 'No pone cancha'}
        </li>
      </ul>
      {post.notes && <p className="mt-3 border-t border-line/80 pt-3 text-sm text-muted">{post.notes}</p>}
    </article>
  );
}
