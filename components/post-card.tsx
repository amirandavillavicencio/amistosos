import Link from 'next/link';
import type { AvailabilityWithTeam } from '@/lib/types';

interface PostCardProps {
  post: AvailabilityWithTeam;
  compact?: boolean;
}

const categoryLabel: Record<AvailabilityWithTeam['age_category'], string> = {
  'sub-12': 'Sub-12',
  'sub-14': 'Sub-14',
  'sub-16': 'Sub-16',
  'sub-18': 'Sub-18',
  'sub-20': 'Sub-20',
  tc: 'Todo Competidor (TC)'
};

function phoneHref(phone: string | null) {
  if (!phone) return null;
  const keepPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/[\s()\-]/g, '');
  return keepPlus ? `+${digits.replace(/^\+/, '')}` : digits;
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const startTime = post.start_time?.slice(0, 5) || '--:--';
  const endTime = post.end_time?.slice(0, 5) || '--:--';
  const weekdays = Array.isArray(post?.weekdays) ? post.weekdays : post?.weekday ? [post.weekday] : [];
  const days = weekdays.filter(Boolean).join(', ');
  const tel = phoneHref(post.phone);

  return (
    <article className={`card-panel transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(77,56,36,0.12)] ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className={`display-serif break-words font-semibold text-ink ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
            <Link href={`/publicaciones/${post.id}`} className="hover:text-accent">
              {post.club_name || 'Equipo sin nombre'}
            </Link>
          </h3>
          <p className="text-xs text-muted">
            {post.comuna} · {categoryLabel[post.age_category]} · {post.branch}
          </p>
        </div>
        {post.logo_url ? (
          <img src={post.logo_url} alt={`Logo ${post.club_name}`} className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} rounded-full border border-line object-cover`} />
        ) : (
          <div className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} flex items-center justify-center rounded-full border border-dashed border-line text-[11px] text-muted`}>
            Sin logo
          </div>
        )}
      </div>
      <ul className={`space-y-1.5 ${compact ? 'text-xs' : 'text-sm'} text-muted`}>
        <li><strong className="text-ink">Horario:</strong> {startTime} - {endTime}</li>
        <li><strong className="text-ink">Días:</strong> {days || 'Sin días informados'}</li>
        <li><strong className="text-ink">Cancha:</strong> {post.has_court ? 'Sí pone cancha' : 'No pone cancha'}</li>
        {post.phone && tel && <li><strong className="text-ink">Tel:</strong> <a href={`tel:${tel}`} className="text-accent hover:underline">{post.phone}</a></li>}
      </ul>
      {!compact && post.notes && <p className="mt-3 border-t border-line/80 pt-3 text-sm text-muted">{post.notes}</p>}
      <div className="mt-3 border-t border-line/80 pt-3">
        <Link href={`/publicaciones/${post.id}`} className={`font-medium text-accent hover:underline ${compact ? 'text-xs' : 'text-sm'}`}>
          Ver detalle / Editar disponibilidad
        </Link>
      </div>
    </article>
  );
}
