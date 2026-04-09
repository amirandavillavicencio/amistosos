'use client';

import { useState } from 'react';
import { registerMatchResult } from '@/app/actions';
import type { TeamRow } from '@/lib/types';

interface ResultFormProps {
  teams: TeamRow[];
}

const matchTypes = ['amistoso', 'torneo', 'entrenamiento', 'competitivo'] as const;

export default function ResultForm({ teams }: ResultFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSuccess(null);
        try {
          await registerMatchResult(formData);
          setSuccess('Resultado guardado correctamente.');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error inesperado al guardar.');
        }
      }}
      className="card-panel grid gap-4 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <select name="club_id" className="field" required>
          <option value="">Mi club</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.club_name}
            </option>
          ))}
        </select>

        <select name="opponent_club_id" className="field">
          <option value="">Rival existente (opcional)</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.club_name}
            </option>
          ))}
        </select>

        <input name="opponent_name" className="field md:col-span-2" placeholder="Rival manual (si no existe en base)" />

        <input type="date" name="match_date" required className="field" />

        <select name="branch" required className="field">
          <option value="">Rama</option>
          <option value="femenina">Femenina</option>
          <option value="masculina">Masculina</option>
          <option value="mixta">Mixta</option>
        </select>

        <select name="match_type" required className="field">
          <option value="">Tipo de partido</option>
          {matchTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input type="number" name="sets_won" min={0} required className="field" placeholder="Sets ganados" />
        <input type="number" name="sets_lost" min={0} required className="field" placeholder="Sets perdidos" />

        <input name="set_scores" className="field" placeholder="Marcador por sets (ej: 25-22, 22-25, 15-12)" />
        <input name="location" className="field" placeholder="Ubicación (opcional)" />
      </div>

      <textarea name="notes" className="field min-h-20" placeholder="Notas adicionales (opcional)" />

      <button type="submit" className="rounded-xl border border-accent/30 bg-accent px-5 py-3 text-sm font-semibold text-white">
        Registrar resultado
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
    </form>
  );
}
