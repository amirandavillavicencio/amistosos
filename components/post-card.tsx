import type { PostRow } from '@/lib/types';

interface PostCardProps {
  post: PostRow;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-panel/80 p-5 shadow-glow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">{post.club_name}</h3>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{post.level}</span>
      </div>
      <ul className="space-y-2 text-sm text-slate-300">
        <li>
          <strong className="text-slate-100">Comuna:</strong> {post.comuna} · {post.city}
        </li>
        <li>
          <strong className="text-slate-100">Horario:</strong> {post.start_time.slice(0, 5)} -{' '}
          {post.end_time.slice(0, 5)}
        </li>
        <li>
          <strong className="text-slate-100">Rama:</strong> {post.branch}
        </li>
        <li>
          <strong className="text-slate-100">Cancha:</strong> {post.has_court ? 'Sí pone cancha' : 'No pone cancha'}
        </li>
        <li>
          <strong className="text-slate-100">Contacto:</strong> {post.contact_email} / {post.instagram}
        </li>
      </ul>
      {post.notes && <p className="mt-3 text-sm text-muted">{post.notes}</p>}
    </article>
  );
}
