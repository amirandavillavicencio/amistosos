import type { MatchPhotoRow } from '@/lib/types';

export default function MatchPhotoCard({ photo }: { photo: MatchPhotoRow }) {
  return (
    <article className="card-panel overflow-hidden">
      <img
        src={photo.image_url}
        alt={`${photo.club_name} vs ${photo.opponent_name}`}
        className="h-48 w-full object-cover sm:h-56"
      />
      <div className="space-y-2 p-4">
        <h3 className="display-serif break-words text-xl font-semibold text-ink sm:text-2xl">
          {photo.club_name} vs {photo.opponent_name}
        </h3>
        <p className="text-sm text-muted">
          {photo.match_date} · {photo.comuna}
        </p>
        {photo.result && <p className="text-sm font-medium text-accent">Resultado: {photo.result}</p>}
        {photo.comment && <p className="border-t border-line/80 pt-2 text-sm text-muted">{photo.comment}</p>}
      </div>
    </article>
  );
}
