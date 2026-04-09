'use client';

import { useState } from 'react';
import { uploadMatchPhoto } from '@/app/actions';

export default function MatchPhotoForm() {
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSuccess(null);
        try {
          await uploadMatchPhoto(formData);
          setClubName('');
          setSuccess('¡Foto publicada! Ya aparece en Partidos reales y en el ranking.');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'No pudimos subir la foto.');
        }
      }}
      className="card-panel grid gap-4 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="club_name"
          required
          placeholder="Nombre del equipo"
          className="field"
          value={clubName}
          onChange={(event) => setClubName(event.target.value)}
        />
        <input name="opponent_name" required placeholder="Rival" className="field" />
        <input name="match_date" type="date" required className="field" />
        <input name="comuna" required placeholder="Comuna" className="field" />
        <input name="result" placeholder="Resultado (ej: 3-1)" className="field" />
        <input
          name="image"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="field file:mr-3 file:rounded-lg file:border file:border-line file:bg-sand file:px-3 file:py-2 file:text-ink"
        />
      </div>

      <textarea name="comment" placeholder="Comentario corto (opcional)" className="field min-h-20" />

      <p className="text-xs text-muted">Formato recomendado: JPG o WEBP. Máximo 6MB.</p>

      <button type="submit" className="rounded-xl border border-accent/30 bg-accent px-5 py-3 text-sm font-semibold text-white">
        Subir foto del partido
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
    </form>
  );
}
