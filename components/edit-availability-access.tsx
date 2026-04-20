'use client';

import { useState } from 'react';
import { verifyAvailabilityOwnership } from '@/app/actions';
import EditAvailabilityForm from '@/components/edit-availability-form';
import type { AvailabilityWithTeam } from '@/lib/types';

export default function EditAvailabilityAccess({ post }: { post: AvailabilityWithTeam }) {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  return (
    <div className="mt-4">
      {!verifiedEmail ? (
        <form
          action={async (formData) => {
            setStatusError(null);
            setStatusMessage(null);
            const email = String(formData.get('verification_email') || '').trim();
            const result = await verifyAvailabilityOwnership(post.id, email);
            if (!result.ok || !result.verifiedEmail) {
              setStatusError(result.message || 'No pudimos verificar el correo.');
              return;
            }
            setVerifiedEmail(result.verifiedEmail);
            setStatusMessage(result.message || 'Correo verificado, puedes editar esta disponibilidad.');
          }}
          className="app-card mt-5 grid gap-3 p-4 sm:p-5"
        >
          <p className="text-sm text-slate-200">Ingresa el correo con el que publicaste para habilitar la edición.</p>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Correo de verificación</label>
            <input
              name="verification_email"
              type="email"
              required
              className="field"
              placeholder="correo usado al publicar"
            />
          </div>
          <button type="submit" className="btn-accent w-full justify-center md:w-auto">Verificar correo</button>
          {statusError && <p className="text-sm text-rose-300">{statusError}</p>}
          {statusMessage && <p className="text-sm text-emerald-300">{statusMessage}</p>}
        </form>
      ) : (
        <>
          {statusMessage && <p className="mb-2 text-sm text-emerald-300">{statusMessage}</p>}
          <EditAvailabilityForm post={post} verifiedEmail={verifiedEmail} />
        </>
      )}
    </div>
  );
}
