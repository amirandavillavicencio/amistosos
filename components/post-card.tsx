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
    <article className={`rounded-3xl border border-[#e2d5c8] bg-[#fffaf3] transition hover:-translate-y-0.5 ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h3 className={`break-words font-semibold text-[#3f2d1f] ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
            <Link href={`/publicaciones/${post.id}`} className="transition hover:text-[#9a5b3f]">
              {post.club_name || 'Equipo sin nombre'}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full border border-[#d8c6b6] bg-[#f8efe4] px-2 py-0.5 text-[#5f4d3e]">{formatComuna(post.comuna)}</span>
            <span className="rounded-full border border-[#d8c6b6] bg-[#f8efe4] px-2 py-0.5 text-[#5f4d3e]">{formatCategory(post.age_category)}</span>
            <span className="rounded-full border border-[#d8c6b6] bg-[#f8efe4] px-2 py-0.5 text-[#5f4d3e]">{formatBranch(post.branch)}</span>
          </div>
        </div>
        <TeamAvatar name={post.club_name} logoUrl={post.logo_url} sizeClassName="h-12 w-12" />
      </div>
      <ul className={`space-y-1.5 ${compact ? 'text-xs' : 'text-sm'} text-[#5f4d3e]`}>
        <li><strong className="text-[#3f2d1f]">Horario:</strong> {startTime} - {endTime}</li>
        <li><strong className="text-[#3f2d1f]">Día:</strong> {days || 'Sin días informados'}</li>
        <li>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${post.has_court ? 'border border-[#b8c99f] bg-[#eff6e5] text-[#43603a]' : 'border border-[#d8c6b6] bg-[#f8efe4] text-[#5f4d3e]'}`}>
            {post.has_court ? 'Tiene cancha' : 'No tiene cancha'}
          </span>
        </li>
      </ul>
      <TeamContact
        instagram={post.instagram}
        phone={post.phone}
        className={`mt-2 space-y-1 ${compact ? 'text-xs' : 'text-sm'} text-[#5f4d3e]`}
        labelClassName="font-semibold text-[#4f3f31]"
        valueClassName="text-[#7a4c37] hover:underline"
      />
      {!compact && post.notes && <p className="mt-3 border-t border-[#eadfd4] pt-3 text-sm text-[#6b5a4c]">{post.notes}</p>}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#eadfd4] pt-3">
        <Link href={`/publicaciones/${post.id}`} className={`btn-secondary !px-3.5 !py-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          Ver detalle
        </Link>
        {canEdit ? <Link href={`/publicaciones/${post.id}/editar`} className={`btn-secondary !px-3.5 !py-2 ${compact ? 'text-xs' : 'text-sm'}`}>Editar</Link> : null}
      </div>
    </article>
  );
}
