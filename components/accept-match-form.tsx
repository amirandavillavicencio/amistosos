'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptSuggestedMatch } from '@/app/actions';

interface AcceptMatchFormProps {
  postAId: string;
  postBId: string;
  teamAName: string;
  teamBName: string;
  defaultAEmail: string;
  defaultBEmail: string;
}

export default function AcceptMatchForm({
  postAId,
  postBId,
  teamAName,
  teamBName,
  defaultAEmail,
  defaultBEmail
}: AcceptMatchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          const result = await acceptSuggestedMatch(formData);

          if (!result?.ok) {
            setError(result?.message || 'No pudimos confirmar este match.');
            return;
          }

          router.push('/match-confirmado');
        });
      }}
      className="mt-6 space-y-4"
      aria-busy={isPending}
    >
      <fieldset disabled={isPending} className="space-y-4 disabled:opacity-80">
        <input type="hidden" name="website" value="" />
        <input type="hidden" name="post_a_id" value={postAId} />
        <input type="hidden" name="post_b_id" value={postBId} />

        <div>
          <label htmlFor="club_a_email" className="block text-sm font-medium text-ink">
            Correo de contacto · {teamAName}
          </label>
          <input
            id="club_a_email"
            name="club_a_email"
            type="email"
            required
            defaultValue={defaultAEmail}
            placeholder="equipoa@club.cl"
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="club_b_email" className="block text-sm font-medium text-ink">
            Correo de contacto · {teamBName}
          </label>
          <input
            id="club_b_email"
            name="club_b_email"
            type="email"
            required
            defaultValue={defaultBEmail}
            placeholder="equipob@club.cl"
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="submit" disabled={isPending} className="btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70">
          {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
          {isPending ? 'Confirmando...' : 'Confirmar match'}
        </button>
      </div>

      {isPending && (
        <p className="text-sm text-muted" role="status" aria-live="polite">
          Estamos confirmando el match, por favor espera...
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
