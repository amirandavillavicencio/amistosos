'use client';

import Link from 'next/link';
import type { AvailabilityWithTeam } from '@/lib/types';
import TeamContact from '@/components/team-contact';
import { StatusBadge } from '@/components/ui-shell';
import { useAuthState } from '@/components/auth-controls';

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

export default function PostCard({ post, compact = false }: PostCardProps) {
  const { userId } = useAuthState();
  const canEdit = Boolean(userId && post.owner_id && userId === post.owner_id);
  const startTime = post.start_time?.slice(0, 5) || '--:--';
  const endTime = post.end_time?.slice(0, 5) || '--:--';
  const weekdays = Array.isArray(post?.weekdays) ? post.weekdays : post?.weekday ? [post.weekday] : [];
  const days = weekdays.filter(Boolean).join(', ');
  return (
    <article className={`group app-card transition hover:-translate-y-0.5 hover:border-fuchsia-300/40 ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h3 className={`break-words font-bold text-white ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
            <Link href={`/publicaciones/${post.id}`} className="transition group-hover:text-fuchsia-200">
              {post.club_name || 'Equipo sin nombre'}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
            <StatusBadge>{post.comuna || 'Sin comuna'}</StatusBadge>
            <StatusBadge tone="accent">{categoryLabel[post.age_category]}</StatusBadge>
            <StatusBadge>{post.branch}</StatusBadge>
          </div>
        </div>
        {post.logo_url ? (
          <img src={post.logo_url} alt={`Logo ${post.club_name}`} className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} rounded-full border border-slate-500 object-cover`} />
        ) : (
          <div className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} flex items-center justify-center rounded-full border border-dashed border-slate-500 text-[11px] text-slate-300`}>
            Sin logo
          </div>
        )}
      </div>
      <ul className={`space-y-1.5 ${compact ? 'text-xs' : 'text-sm'} text-slate-200`}>
        <li><strong className="text-slate-100">Horario:</strong> {startTime} - {endTime}</li>
        <li><strong className="text-slate-100">Días:</strong> {days || 'Sin días informados'}</li>
        <li><strong className="text-slate-100">Cancha:</strong> {post.has_court ? 'Sí pone cancha' : 'No pone cancha'}</li>
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
