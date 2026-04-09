import type { AvailabilityWithTeam } from '@/lib/types';

interface PostCardProps {
  post: AvailabilityWithTeam;
}

export default function PostCard({ post }: PostCardProps) {
  const team = post.team;

  return (
    <article className="card-panel p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(77,56,36,0.14)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="display-serif text-2xl font-semibold text-ink">{team.club_name}</h3>
          <p className="text-xs text-muted">
            {team.comuna}, {team.city} · {team.branch}
          </p>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">{post.desired_level}</span>
      </div>
      <ul className="space-y-2 text-sm text-muted">
        <li>
          <strong className="text-ink">Horario:</strong> {post.start_time.slice(0, 5)} - {post.end_time.slice(0, 5)}
        </li>
        <li>
          <strong className="text-ink">Cancha:</strong> {post.has_court ? 'Sí pone cancha' : 'No pone cancha'}
        </li>
        <li>
          <strong className="text-ink">Contacto:</strong> {team.contact_email} / {team.instagram}
        </li>
      </ul>
      {post.notes && <p className="mt-3 border-t border-line/80 pt-3 text-sm text-muted">{post.notes}</p>}
    </article>
  );
}
