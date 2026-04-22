'use client';

import Link from 'next/link';
import type { AvailabilityWithTeam } from '@/lib/types';
import TeamContact from '@/components/team-contact';
import { useAuthState } from '@/components/auth-controls';
import TeamAvatar from '@/components/team-avatar';
import { capitalize, formatBranch, formatCategory, formatComuna } from '@/lib/presentation';

interface PostCardProps {
  post: AvailabilityWithTeam;
  compact?: boolean;
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const { userId } = useAuthState();
  const canEdit = Boolean(userId && post.owner_id && userId === post.owner_id);
  const startTime = post.start_time?.slice(0, 5) || '--:--';
  const endTime = post.end_time?.slice(0, 5) || '--:--';
  const weekdays = Array.isArray(post?.weekdays) ? post.weekdays : post?.weekday ? [post.weekday] : [];
  const days = weekdays.filter(Boolean).map((day) => capitalize(day)).join(', ');

  return (
    <article className={`group app-card transition hover:-translate-y-0.5 hover:border-fuchsia-300/40 ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h3 className={`break-words font-bold text-white ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
            <Link href={`/publicaciones/${post.id}`} className="transition group-hover:text-fuchsia-200">
              {post.club_name || 'Equipo sin nombre'}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full border border-slate-500/60 bg-slate-800/70 px-2 py-0.5 text-slate-100">{formatComuna(post.comuna)}</span>
            <span className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2 py-0.5 text-sky-100">{formatCategory(post.age_category)}</span>
            <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-100">{formatBranch(post.branch)}</span>
          </div>
        </div>
        <TeamAvatar name={post.club_name} logoUrl={post.logo_url} sizeClassName={compact ? 'h-12 w-12' : 'h-12 w-12'} />
      </div>
      <ul className={`space-y-1.5 ${compact ? 'text-xs' : 'text-sm'} text-slate-200`}>
        <li><strong className="text-slate-100">Horario:</strong> {startTime} - {endTime}</li>
        <li><strong className="text-slate-100">Días:</strong> {days || 'Sin días informados'}</li>
        <li>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${post.has_court ? 'border border-emerald-300/40 bg-emerald-500/10 text-emerald-100' : 'border border-slate-500/60 bg-slate-800/70 text-slate-200'}`}>
            {post.has_court ? '✓ Pone cancha' : '✗ Sin cancha'}
          </span>
        </li>
      </ul>
      <TeamContact
        instagram={post.instagram}
        phone={post.phone}
        className={`mt-2 space-y-1 ${compact ? 'text-xs' : 'text-sm'} text-slate-200`}
        labelClassName="font-semibold text-slate-100"
      />
      {!compact && post.notes && <p className="mt-3 border-t border-slate-700/80 pt-3 text-sm text-slate-300">{post.notes}</p>}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-700/80 pt-3">
        <Link href={`/publicaciones/${post.id}`} className={`btn-secondary !px-3.5 !py-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          Ver detalle
        </Link>
        {canEdit ? (
          <Link href={`/publicaciones/${post.id}/editar`} className={`btn-secondary !px-3.5 !py-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            Editar
          </Link>
        ) : null}
      </div>
    </article>
  );
}
