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
    <article className={`rounded-3xl border border-[#d4e2fa] bg-white transition hover:-translate-y-0.5 hover:shadow-md ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h3 className={`break-words font-semibold text-[#0f2f6a] ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
            <Link href={`/publicaciones/${post.id}`} className="transition hover:text-[#1f58ad]">
              {post.club_name || 'Equipo sin nombre'}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full border border-[#bfd3f4] bg-[#edf4ff] px-2 py-0.5 text-[#1e4f9f]">{formatComuna(post.comuna)}</span>
            <span className="rounded-full border border-[#f8d86a] bg-[#fff6d3] px-2 py-0.5 text-[#725700]">{formatCategory(post.age_category)}</span>
            <span className="rounded-full border border-[#b7dfc7] bg-[#e9f8ef] px-2 py-0.5 text-[#2f7b4d]">{formatBranch(post.branch)}</span>
          </div>
        </div>
        <TeamAvatar name={post.club_name} logoUrl={post.logo_url} sizeClassName="h-12 w-12" />
      </div>
      <ul className={`space-y-1.5 ${compact ? 'text-xs' : 'text-sm'} text-[#2d4f88]`}>
        <li><strong className="text-[#0f2f6a]">Horario:</strong> {startTime} - {endTime}</li>
        <li><strong className="text-[#0f2f6a]">Día:</strong> {days || 'Sin días informados'}</li>
        <li>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${post.has_court ? 'border border-[#b7dfc7] bg-[#e9f8ef] text-[#2f7b4d]' : 'border border-[#f8d86a] bg-[#fff6d3] text-[#725700]'}`}>
            {post.has_court ? 'Tiene cancha' : 'No tiene cancha'}
          </span>
        </li>
      </ul>
      <TeamContact
        instagram={post.instagram}
        phone={post.phone}
        className={`mt-2 space-y-1 ${compact ? 'text-xs' : 'text-sm'} text-[#2d4f88]`}
        labelClassName="font-semibold text-[#12336a]"
        valueClassName="text-[#1e4f9f] hover:underline"
      />
      {!compact && post.notes && <p className="mt-3 border-t border-[#e2ecfc] pt-3 text-sm text-[#2d4f88]">{post.notes}</p>}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e2ecfc] pt-3">
        <Link href={`/publicaciones/${post.id}`} className={`btn-secondary !px-3.5 !py-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          Ver detalle
        </Link>
        {canEdit ? <Link href={`/publicaciones/${post.id}/editar`} className={`btn-secondary !px-3.5 !py-2 ${compact ? 'text-xs' : 'text-sm'}`}>Editar</Link> : null}
      </div>
    </article>
  );
}
