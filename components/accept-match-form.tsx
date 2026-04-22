'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { getMatchContact } from '@/app/actions';

interface RivalContact {
  clubName: string;
  comuna: string;
  hasCourt: boolean;
  contactEmail: string;
  notes: string | null;
}

interface AcceptMatchFormProps {
  matchId: string;
  initialMatchStatus: 'active' | 'matched';
  initialContact: RivalContact | null;
}

export default function AcceptMatchForm({ matchId, initialMatchStatus, initialContact }: AcceptMatchFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<RivalContact | null>(initialContact);
  const [matchDone, setMatchDone] = useState(initialMatchStatus === 'matched');
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialMatchStatus === 'matched' ? 'Match coordinado. Ya tienes el contacto del rival.' : null
  );

  const mapErrorMessage = (message?: string) => {
    if (!message) {
      return 'No pudimos validar el correo.';
    }

    if (message === 'Este correo no está asociado a este match.') {
      return 'Este correo no pertenece a ninguno de los equipos de este match';
    }

    return message;
  };

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          if (!matchDone) {
            setContact(null);
          }
          setSuccessMessage(null);

          const result = await getMatchContact(formData);

          if (!result?.ok) {
            setError(mapErrorMessage(result?.message));
            return;
          }

          setContact(result.contact);
          setMatchDone(result.matchDone);
          setSuccessMessage(result.successMessage);
        });
      }}
      className="space-y-5"
      aria-busy={isPending}
    >
      <input type="hidden" name="website" value="" />
      <input type="hidden" name="match_id" value={matchId} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent/90">Validación de contacto</p>
        <p className="mt-2 text-sm text-muted">
          Confirma el correo de uno de los equipos para desbloquear el contacto rival.
        </p>
      </div>

      {!matchDone && (
        <>
          <fieldset disabled={isPending} className="space-y-4 disabled:opacity-80">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Correo de un equipo del match
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="tuclub@correo.cl"
                className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={isPending} className="btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70">
              {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
              {isPending ? 'Validando...' : 'Ver contacto'}
            </button>
          </div>
        </>
      )}

      {isPending && (
        <p className="text-sm text-muted" role="status" aria-live="polite">
          Validando correo y registrando match coordinado...
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200" role="status">
          {successMessage}
        </p>
      )}

      {matchDone && (
        <div className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
          Match coordinado
        </div>
      )}

      {contact && (
        <div className="space-y-3">
          <article className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Contacto desbloqueado</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">{contact.clubName}</h3>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              <li><span className="font-medium">Comuna:</span> {contact.comuna}</li>
              <li><span className="font-medium">Cancha:</span> {contact.hasCourt ? 'Sí, tiene cancha' : 'No confirmada'}</li>
              <li><span className="font-medium">Correo:</span> {contact.contactEmail}</li>
              <li><span className="font-medium">Notas:</span> {contact.notes || 'Sin notas'}</li>
            </ul>
          </article>

          {matchDone && (
            <Link href="/" className="btn-accent inline-flex items-center gap-2">
              Volver al inicio
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
