import Link from 'next/link';
import type { AvailabilityWithTeam } from '@/lib/types';

interface PostCardProps {
  post: AvailabilityWithTeam;
}

export default function PostCard({ post }: PostCardProps) {
  const team = post.team;

  return (
    <article className="rounded-2xl border border-white/10 bg-panel/80 p-5 shadow-glow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">{team.club_name}</h3>
          <p className="text-xs text-slate-400">
            ELO {team.current_elo} · {team.matches_played < 3 ? 'Sin historial suficiente' : 'Nivel estimado por resultados'}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{post.desired_level}</span>
      </div>
      <ul className="space-y-2 text-sm text-slate-300">
        <li>
          <strong className="text-slate-100">Comuna:</strong> {post.comuna} · {post.city}
        </li>
        <li>
          <strong className="text-slate-100">Horario:</strong> {post.start_time.slice(0, 5)} - {post.end_time.slice(0, 5)}
        </li>
        <li>
          <strong className="text-slate-100">Rama:</strong> {post.branch}
        </li>
        <li>
          <strong className="text-slate-100">Cancha:</strong> {post.has_court ? 'Sí pone cancha' : 'No pone cancha'}
        </li>
        <li>
          <strong className="text-slate-100">Contacto:</strong> {team.contact_email} / {team.instagram}
        </li>
      </ul>
      {post.notes && <p className="mt-3 text-sm text-muted">{post.notes}</p>}
      <Link href={`/club/${team.id}`} className="mt-4 inline-flex text-sm text-accent hover:underline">
        Ver ficha deportiva
      </Link>
    </article>
  );
}
