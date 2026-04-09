import type { MatchPhotoRow } from '@/lib/types';

export default function MatchPhotoCard({ photo }: { photo: MatchPhotoRow }) {
  return (
    <article className="card-panel overflow-hidden">
      <img src={photo.image_url} alt={`${photo.club_name} vs ${photo.opponent_name}`} className="h-56 w-full object-cover" />
      <div className="space-y-2 p-4">
        <h3 className="display-serif text-2xl font-semibold text-ink">
          {photo.club_name} vs {photo.opponent_name}
        </h3>
        <p className="text-sm text-muted">
          {photo.match_date} · {photo.comuna}
        </p>
        {photo.result && <p className="text-sm text-accent">Resultado: {photo.result}</p>}
        {photo.comment && <p className="text-sm text-muted">{photo.comment}</p>}
      </div>
    </article>
  );
}
