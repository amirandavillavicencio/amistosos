import type { MatchPhotoRow } from '@/lib/types';

export default function MatchPhotoCard({ photo }: { photo: MatchPhotoRow }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-panel/70">
      <img src={photo.image_url} alt={`${photo.club_name} vs ${photo.opponent_name}`} className="h-56 w-full object-cover" />
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold">
          {photo.club_name} vs {photo.opponent_name}
        </h3>
        <p className="text-sm text-slate-300">
          {photo.match_date} · {photo.comuna}
        </p>
        {photo.result && <p className="text-sm text-accent">Resultado: {photo.result}</p>}
        {photo.comment && <p className="text-sm text-slate-400">{photo.comment}</p>}
      </div>
    </article>
  );
}
