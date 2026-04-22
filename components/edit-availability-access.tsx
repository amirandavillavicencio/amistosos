'use client';

import { useState } from 'react';
import { verifyAvailabilityOwnership } from '@/app/actions';
import EditAvailabilityForm from '@/components/edit-availability-form';
import AuthControls, { useAuthState } from '@/components/auth-controls';
import type { AvailabilityWithTeam } from '@/lib/types';

export default function EditAvailabilityAccess({ post }: { post: AvailabilityWithTeam }) {
  const { accessToken, userId } = useAuthState();
  const [verified, setVerified] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  return (
    <div className="mt-4 space-y-3">
      <AuthControls />
      {!verified ? (
        <form
          action={async () => {
            setStatusError(null);
            setStatusMessage(null);
            const result = await verifyAvailabilityOwnership(post.id, accessToken || '');
            if (!result.ok) {
              setStatusError(result.message || 'No pudimos verificar permisos.');
              return;
            }
            setVerified(true);
            setStatusMessage(result.message || 'Propiedad verificada.');
          }}
          className="app-card mt-5 grid gap-3 p-4 sm:p-5"
        >
          <p className="text-sm text-slate-200">Solo el dueño autenticado puede editar esta publicación.</p>
          <button type="submit" disabled={!userId} className="btn-accent w-full justify-center disabled:opacity-60 md:w-auto">Verificar permisos</button>
          {statusError && <p className="text-sm text-rose-300">{statusError}</p>}
          {statusMessage && <p className="text-sm text-emerald-300">{statusMessage}</p>}
        </form>
      ) : (
        <>
          {statusMessage && <p className="mb-2 text-sm text-emerald-300">{statusMessage}</p>}
          <EditAvailabilityForm post={post} accessToken={accessToken || ''} />
        </>
      )}
    </div>
  );
}
