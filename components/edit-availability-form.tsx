'use client';

import { useState } from 'react';
import { updateAvailability, uploadTeamLogo } from '@/app/actions';
import type { AvailabilityWithTeam } from '@/lib/types';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export default function EditAvailabilityForm({
  post,
  verifiedEmail
}: {
  post: AvailabilityWithTeam;
  verifiedEmail?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setMessage(null);
        setError(null);
        const logoFile = formData.get('logo');
        if (logoFile instanceof File && logoFile.size > 0) {
          const logoData = new FormData();
          logoData.append('logo', logoFile);
          const upload = await uploadTeamLogo(logoData);
          if (!upload.ok || !upload.url) {
            setError(upload.message || 'No pudimos subir el logo.');
            return;
          }
          formData.set('logo_url', upload.url);
        }

        const result = await updateAvailability(formData);
        if (!result.ok) {
          setError(result.message || 'No se pudo actualizar la publicación.');
          return;
        }
        setMessage('Disponibilidad actualizada correctamente.');
      }}
      className="app-card mt-5 grid gap-4 p-4 sm:p-6"
    >
      <input type="hidden" name="id" value={post.id} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {verifiedEmail ? (
        <>
          <input type="hidden" name="contact_email" value={verifiedEmail} />
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Correo verificado, puedes editar esta disponibilidad.
          </p>
        </>
      ) : (
        <div>
          <label className="mb-1 block text-sm text-slate-300">Correo de contacto (verificación obligatoria)</label>
          <input name="contact_email" type="email" required className="field" placeholder="correo usado al publicar" />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Comuna</label>
          <input name="comuna" defaultValue={post.comuna} required className="field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Ciudad</label>
          <input name="city" defaultValue={post.city || ''} required className="field" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Cancha</label>
          <select name="has_court" defaultValue={post.has_court ? 'true' : 'false'} className="field">
            <option value="false">No tenemos cancha</option>
            <option value="true">Sí, ponemos cancha</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Nivel</label>
          <select name="level" defaultValue={post.level || 'intermedio'} className="field">
            <option value="principiante">Principiante</option>
            <option value="novato">Novato</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
            <option value="competitivo">Competitivo</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-700 p-3">
        <p className="text-sm text-slate-300">Días disponibles</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekdays.map((day) => (
            <label key={day} className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/30 px-2 py-2 text-sm text-slate-100">
              <input type="checkbox" name="weekdays" value={day} defaultChecked={post.weekdays?.includes(day)} className="h-4 w-4 accent-fuchsia-500" />
              <span className="capitalize">{day}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Hora inicio</label>
          <input name="start_time" type="time" required min="08:00" max="23:00" step={1800} defaultValue={post.start_time?.slice(0, 5)} className="field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Hora término</label>
          <input name="end_time" type="time" required min="08:00" max="23:00" step={1800} defaultValue={post.end_time?.slice(0, 5)} className="field" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <select name="age_category" required defaultValue={post.age_category} className="field">
          <option value="sub-12">Sub-12</option>
          <option value="sub-14">Sub-14</option>
          <option value="sub-16">Sub-16</option>
          <option value="sub-18">Sub-18</option>
          <option value="sub-20">Sub-20</option>
          <option value="tc">Todo Competidor (TC)</option>
        </select>
        <select name="branch" required defaultValue={post.branch} className="field">
          <option value="femenina">Femenina</option>
          <option value="masculina">Masculina</option>
          <option value="mixta">Mixta</option>
        </select>
      </div>
      <p className="text-xs text-slate-400">Horario permitido: entre 08:00 y 23:00. La hora de término debe ser mayor a la de inicio.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <input name="responsible_name" defaultValue={post.responsible_name || ''} placeholder="Responsable (opcional)" className="field" />
        <input name="phone" defaultValue={post.phone || ''} placeholder="Teléfono (opcional)" className="field" />
        <input name="instagram" defaultValue={post.instagram ? `@${post.instagram}` : ''} placeholder="Instagram (opcional)" className="field" />
        <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="field file:mr-2 file:rounded-lg file:border file:border-slate-500/80 file:bg-slate-900 file:px-3 file:py-2 file:text-slate-200" />
        <input name="logo_url" defaultValue={post.logo_url || ''} placeholder="URL logo (opcional)" className="field" />
      </div>

      <textarea name="notes" defaultValue={post.notes || ''} placeholder="Observaciones" className="field min-h-24" />

      <button type="submit" className="btn-accent w-full justify-center md:w-auto">Guardar cambios</button>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {message && <p className="text-sm text-emerald-300">{message}</p>}
    </form>
  );
}
