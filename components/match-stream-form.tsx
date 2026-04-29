'use client';

import { useState } from 'react';
import { saveMatchStream } from '@/app/actions';

export default function MatchStreamForm({ matchId }: { matchId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setMessage(null);
        setError(null);
        const result = await saveMatchStream(formData);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setMessage(result.message);
      }}
      className="mt-4 grid gap-2 rounded-xl border border-[#f0c7c7] bg-white p-3"
    >
      <input type="hidden" name="match_id" value={matchId} />
      <p className="text-sm font-semibold text-[#8a2727]">Agregar transmisión</p>
      <input name="stream_url" className="field" placeholder="Link de transmisión" />
      <input name="correo_equipo" type="email" className="field" placeholder="Correo del equipo" />
      <button type="submit" className="btn-secondary w-fit">Guardar transmisión</button>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </form>
  );
}
