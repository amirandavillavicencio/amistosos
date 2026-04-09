'use client';

import { useState } from 'react';
import { uploadMatchPhoto } from '@/app/actions';

export default function MatchPhotoForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSuccess(null);
        try {
          await uploadMatchPhoto(formData);
          setSuccess('¡Foto publicada! Ya aparece en Partidos reales y en el ranking.');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'No pudimos subir la foto.');
        }
      }}
      className="grid gap-4 rounded-2xl border border-white/10 bg-panel/70 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <input name="club_name" required placeholder="Nombre del equipo" className="field" />
        <input name="opponent_name" required placeholder="Rival" className="field" />
        <input name="match_date" type="date" required className="field" />
        <input name="comuna" required placeholder="Comuna" className="field" />
        <input name="result" placeholder="Resultado (ej: 3-1)" className="field" />
        <input
          name="image"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="field file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-slate-100"
        />
      </div>

      <textarea name="comment" placeholder="Comentario corto (opcional)" className="field min-h-20" />

      <p className="text-xs text-slate-400">Formato recomendado: JPG o WEBP. Máximo 6MB.</p>

      <button type="submit" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white">
        Subir foto del partido
      </button>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {success && <p className="text-sm text-emerald-300">{success}</p>}
    </form>
  );
}
