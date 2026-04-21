'use client';

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
}

export default function AcceptMatchForm({ matchId }: AcceptMatchFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<RivalContact | null>(null);

  const mapErrorMessage = (message?: string) => {
    if (!message) {
      return 'No pudimos validar el correo.';
    }

    if (message === 'Este correo no está asociado a este match.') {
      return 'Este correo no pertenece a ninguno de los equipos de este match';
    }

    return message;
  };

  if (!isExpanded) {
    return (
      <div className="mt-6">
        <button
          type="button"
          className="btn-accent inline-flex items-center gap-2"
          onClick={() => {
            setError(null);
            setContact(null);
            setIsExpanded(true);
          }}
        >
          Hacer match
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          setContact(null);

          const result = await getMatchContact(formData);

          if (!result?.ok) {
            setError(mapErrorMessage(result?.message));
            return;
          }

          setContact(result.contact);
        });
      }}
      className="mt-6 space-y-4"
      aria-busy={isPending}
    >
      <p className="text-sm text-ink">Pon un correo de uno de los equipos para ver el contacto del rival</p>

      <fieldset disabled={isPending} className="space-y-4 disabled:opacity-80">
        <input type="hidden" name="website" value="" />
        <input type="hidden" name="match_id" value={matchId} />

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

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="submit" disabled={isPending} className="btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70">
          {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
          {isPending ? 'Validando...' : 'Ver contacto'}
        </button>
      </div>

      {isPending && (
        <p className="text-sm text-muted" role="status" aria-live="polite">
          Validando correo y desbloqueando contacto...
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      {contact && (
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Contacto desbloqueado</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{contact.clubName}</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            <li><span className="font-medium">Comuna:</span> {contact.comuna}</li>
            <li><span className="font-medium">Cancha:</span> {contact.hasCourt ? 'Sí, tiene cancha' : 'No confirmada'}</li>
            <li><span className="font-medium">Correo:</span> {contact.contactEmail}</li>
            <li><span className="font-medium">Notas:</span> {contact.notes || 'Sin notas'}</li>
          </ul>
        </article>
      )}
    </form>
  );
}
