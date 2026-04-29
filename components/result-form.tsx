'use client';

import { useEffect, useMemo, useState } from 'react';
import { registerMatchResult } from '@/app/actions';
import type { TeamRow } from '@/lib/types';

interface ResultFormProps {
  teams: TeamRow[];
  initialClubId?: string;
  initialOpponentClubId?: string;
  initialClubName?: string;
  initialOpponentName?: string;
}

const matchTypes = ['amistoso', 'torneo', 'entrenamiento', 'competitivo'] as const;
const requiredFields = ['club_id', 'opponent_club_id', 'match_date', 'branch', 'match_type', 'sets_won', 'sets_lost', 'winner_club_id'] as const;

type FieldErrors = Partial<Record<(typeof requiredFields)[number], string>>;

function fieldClass(hasError: boolean) {
  return `field ${hasError ? 'border-rose-400 ring-2 ring-rose-500/30 focus:border-rose-300 focus:ring-rose-500/30' : ''}`;
}

function findTeamIdByName(teams: TeamRow[], rawName?: string): string {
  const name = String(rawName || '').trim().toLowerCase();
  if (!name) return '';
  return teams.find((team) => team.club_name.trim().toLowerCase() === name)?.id || '';
}

export default function ResultForm({ teams, initialClubId, initialOpponentClubId, initialClubName, initialOpponentName }: ResultFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [clubId, setClubId] = useState('');
  const [opponentId, setOpponentId] = useState('');
  const [winnerId, setWinnerId] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [estadoConfirmacion, setEstadoConfirmacion] = useState<'pendiente' | 'confirmado'>('pendiente');

  useEffect(() => {
    const resolvedClub = initialClubId || findTeamIdByName(teams, initialClubName);
    const resolvedOpponent = initialOpponentClubId || findTeamIdByName(teams, initialOpponentName);
    if (resolvedClub) setClubId(resolvedClub);
    if (resolvedOpponent) setOpponentId(resolvedOpponent);
  }, [initialClubId, initialOpponentClubId, initialClubName, initialOpponentName, teams]);

  const isSubmitDisabled = !opponentId || !clubId || !winnerId;
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

        const setsWon = Number(formData.get('sets_won') || 0);
        const setsLost = Number(formData.get('sets_lost') || 0);
        const selectedWinner = String(formData.get('winner_club_id') || '').trim();
        const selectedClub = String(formData.get('club_id') || '').trim();
        const selectedOpponent = String(formData.get('opponent_club_id') || '').trim();

        if (selectedClub && selectedOpponent && selectedClub === selectedOpponent) {
          nextErrors.opponent_club_id = 'El rival debe ser distinto a tu club.';
        }

        if (selectedWinner && selectedClub && selectedOpponent && selectedWinner !== selectedClub && selectedWinner !== selectedOpponent) {
          nextErrors.winner_club_id = 'El ganador debe ser tu club o el rival seleccionado.';
        }

        if (selectedWinner === selectedClub && setsWon <= setsLost) {
          nextErrors.winner_club_id = 'El ganador no coincide con el marcador cargado.';
        }

        if (selectedWinner === selectedOpponent && setsLost <= setsWon) {
          nextErrors.winner_club_id = 'El ganador no coincide con el marcador cargado.';
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          setError('Revisa los campos marcados en rojo.');
          return;
        }

        setFieldErrors({});

        try {
          await registerMatchResult(formData);
          const hasA = String(formData.get('codigo_equipo_a') || '').trim().length > 0;
          const hasB = String(formData.get('codigo_equipo_b') || '').trim().length > 0;
          setEstadoConfirmacion(hasA && hasB ? 'confirmado' : 'pendiente');
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
          <label className="mb-1 block text-xs text-slate-300">Mi club (local / propio) *</label>
          <select name="club_id" className={fieldClass(Boolean(fieldErrors.club_id))} required value={clubId} onChange={(event) => setClubId(event.target.value)}>
            <option value="">Mi club</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.club_name}</option>
            ))}
          </select>
          {fieldErrors.club_id && <p className="mt-1 text-xs text-rose-300">{fieldErrors.club_id}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-300">Rival *</label>
          <select name="opponent_club_id" className={fieldClass(Boolean(fieldErrors.opponent_club_id))} required value={opponentId} onChange={(event) => setOpponentId(event.target.value)}>
            <option value="">Selecciona rival</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.club_name}</option>
            ))}
          </select>
          {fieldErrors.opponent_club_id && <p className="mt-1 text-xs text-rose-300">{fieldErrors.opponent_club_id}</p>}
        </div>

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
          <label className="mb-1 block text-xs text-slate-300">Ganador *</label>
          <select
            name="winner_club_id"
            required
            value={winnerId}
            onChange={(event) => setWinnerId(event.target.value)}
            className={fieldClass(Boolean(fieldErrors.winner_club_id))}
          >
            <option value="">Selecciona ganador</option>
            {clubId ? <option value={clubId}>Mi club</option> : null}
            {opponentId ? <option value={opponentId}>Rival</option> : null}
          </select>
          {fieldErrors.winner_club_id && <p className="mt-1 text-xs text-rose-300">{fieldErrors.winner_club_id}</p>}
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
        <input name="codigo_equipo_a" className="field" placeholder="Código de equipo A" />
        <input name="codigo_equipo_b" className="field" placeholder="Código de equipo B" />

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-slate-300">Foto comprobante (opcional)</label>
          <input
            name="proof_photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field file:mr-2 file:mt-1 file:rounded-lg file:border file:border-line file:bg-sand file:px-3 file:py-2 file:text-ink sm:file:mr-3 sm:file:mt-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setProofPreview(null);
                return;
              }
              setProofPreview(URL.createObjectURL(file));
            }}
          />
          <p className="mt-1 text-xs text-slate-400">La foto se asociará automáticamente a este rival y resultado.</p>
          {proofPreview ? <img src={proofPreview} alt="Vista previa comprobante" className="mt-2 h-36 rounded-xl object-cover" /> : null}
        </div>
      </div>

      <textarea name="notes" className="field min-h-20" placeholder="Observación (opcional)" />

      <button type="submit" disabled={isSubmitDisabled} className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-60 md:w-fit">Cargar resultado</button>

      {isSubmitDisabled && <p className="text-xs text-rose-300">Completa club, rival y ganador para continuar.</p>}
      <div className={`rounded-xl px-3 py-2 text-sm ${estadoConfirmacion === 'confirmado' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'}`}>
        {estadoConfirmacion === 'confirmado' ? 'Resultado confirmado. Este resultado ya puede contar para el ranking' : 'Resultado pendiente de confirmación. Falta el código del otro equipo'}
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <p className={successClass}>{success}</p>
    </form>
  );
}
