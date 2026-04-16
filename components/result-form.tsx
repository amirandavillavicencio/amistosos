'use client';

import { useMemo, useState } from 'react';
import { registerMatchResult } from '@/app/actions';
import type { TeamRow } from '@/lib/types';

interface ResultFormProps {
  teams: TeamRow[];
}

const matchTypes = ['amistoso', 'torneo', 'entrenamiento', 'competitivo'] as const;
const requiredFields = ['club_id', 'opponent_club_id', 'match_date', 'branch', 'match_type', 'sets_won', 'sets_lost'] as const;

type FieldErrors = Partial<Record<(typeof requiredFields)[number], string>>;

function fieldClass(hasError: boolean) {
  return `field ${hasError ? 'border-rose-400 ring-2 ring-rose-500/30 focus:border-rose-300 focus:ring-rose-500/30' : ''}`;
}

export default function ResultForm({ teams }: ResultFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [opponentId, setOpponentId] = useState('');

  const isSubmitDisabled = !opponentId;
  const successClass = useMemo(() => (success ? 'text-sm text-emerald-300' : 'hidden'), [success]);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSuccess(null);

        const nextErrors: FieldErrors = {};
        for (const field of requiredFields) {
          if (!String(formData.get(field) || '').trim()) {
            nextErrors[field] = 'Este campo es obligatorio.';
          }
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          setError('Revisa los campos marcados en rojo.');
          return;
        }

        setFieldErrors({});

        try {
          await registerMatchResult(formData);
          setSuccess('Resultado guardado correctamente.');
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error inesperado al guardar.');
        }
      }}
      className="app-card grid gap-4 p-4 sm:p-6"
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-300">Mi club *</label>
          <select name="club_id" className={fieldClass(Boolean(fieldErrors.club_id))} required>
            <option value="">Mi club</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.club_name}</option>
            ))}
          </select>
          {fieldErrors.club_id && <p className="mt-1 text-xs text-rose-300">{fieldErrors.club_id}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-300">Rival existente *</label>
          <select name="opponent_club_id" className={fieldClass(Boolean(fieldErrors.opponent_club_id))} required value={opponentId} onChange={(event) => setOpponentId(event.target.value)}>
            <option value="">Rival existente</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.club_name}</option>
            ))}
          </select>
          {fieldErrors.opponent_club_id && <p className="mt-1 text-xs text-rose-300">{fieldErrors.opponent_club_id}</p>}
        </div>

        <input name="opponent_name" className="field md:col-span-2 opacity-80" placeholder="Rival manual deshabilitado en esta versión" disabled />

        <div>
          <label className="mb-1 block text-xs text-slate-300">Fecha *</label>
          <input type="date" name="match_date" required className={fieldClass(Boolean(fieldErrors.match_date))} />
          {fieldErrors.match_date && <p className="mt-1 text-xs text-rose-300">{fieldErrors.match_date}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-300">Rama *</label>
          <select name="branch" required className={fieldClass(Boolean(fieldErrors.branch))}>
            <option value="">Rama</option>
            <option value="femenina">Femenina</option>
            <option value="masculina">Masculina</option>
            <option value="mixta">Mixta</option>
          </select>
          {fieldErrors.branch && <p className="mt-1 text-xs text-rose-300">{fieldErrors.branch}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-300">Tipo de partido *</label>
          <select name="match_type" required className={fieldClass(Boolean(fieldErrors.match_type))}>
            <option value="">Tipo de partido</option>
            {matchTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {fieldErrors.match_type && <p className="mt-1 text-xs text-rose-300">{fieldErrors.match_type}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-300">Sets ganados *</label>
          <input type="number" name="sets_won" min={0} required className={fieldClass(Boolean(fieldErrors.sets_won))} placeholder="Sets ganados" />
          {fieldErrors.sets_won && <p className="mt-1 text-xs text-rose-300">{fieldErrors.sets_won}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-300">Sets perdidos *</label>
          <input type="number" name="sets_lost" min={0} required className={fieldClass(Boolean(fieldErrors.sets_lost))} placeholder="Sets perdidos" />
          {fieldErrors.sets_lost && <p className="mt-1 text-xs text-rose-300">{fieldErrors.sets_lost}</p>}
        </div>

        <input name="set_scores" className="field" placeholder="Marcador por sets (ej: 25-22, 22-25, 15-12)" />
        <input name="location" className="field" placeholder="Ubicación (opcional)" />
      </div>

      <textarea name="notes" className="field min-h-20" placeholder="Notas adicionales (opcional)" />

      <button type="submit" disabled={isSubmitDisabled} className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-60 md:w-fit">Registrar resultado</button>

      {isSubmitDisabled && <p className="text-xs text-rose-300">Debes seleccionar un rival existente para continuar.</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <p className={successClass}>{success}</p>
    </form>
  );
}
