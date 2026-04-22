'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAvailability, uploadTeamLogo } from '@/app/actions';
import AuthControls, { useAuthState } from '@/components/auth-controls';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const ageCategories = [
  { value: 'sub-12', label: 'Sub-12' },
  { value: 'sub-14', label: 'Sub-14' },
  { value: 'sub-16', label: 'Sub-16' },
  { value: 'sub-18', label: 'Sub-18' },
  { value: 'sub-20', label: 'Sub-20' },
  { value: 'tc', label: 'Todo Competidor (TC)' }
];

const requiredFields = ['club_name', 'responsible_name', 'contact_email', 'comuna', 'start_time', 'end_time', 'branch', 'age_category', 'has_court'] as const;

type FieldErrors = Partial<Record<(typeof requiredFields)[number] | 'weekdays', string>>;

function fieldClass(hasError: boolean) {
  return `field ${hasError ? 'border-rose-400 ring-2 ring-rose-500/30 focus:border-rose-300 focus:ring-rose-500/30' : ''}`;
}

export default function PublishForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clubName, setClubName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const { userId, accessToken, loading } = useAuthState();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const nextErrors: FieldErrors = {};
          setError(null);

          if (!accessToken) {
            setError('Debes iniciar sesión para publicar.');
            return;
          }

          for (const field of requiredFields) {
            if (!String(formData.get(field) || '').trim()) {
              nextErrors[field] = 'Este campo es obligatorio.';
            }
          }

          const selectedDays = formData.getAll('weekdays').map((day) => String(day).trim()).filter(Boolean);
          if (!selectedDays.length) {
            nextErrors.weekdays = 'Selecciona al menos un día disponible.';
          }

          if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            setError('Revisa los campos marcados en rojo.');
            return;
          }

          setFieldErrors({});

          try {
            formData.set('access_token', accessToken);
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

            const result = await createAvailability(formData);

            if (!result?.ok) {
              setError(result?.message || 'No se pudo guardar la publicación.');
              return;
            }

            setClubName('');
            router.push('/publicacion-exitosa');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
          }
        });
      }}
      aria-busy={isPending}
      className="app-card grid gap-5 p-4 sm:p-6 md:p-7"
    >
      <fieldset disabled={isPending || loading} className="grid gap-5 disabled:opacity-80">
        <AuthControls />
        {!userId ? <p className="text-sm text-amber-300">Inicia sesión para habilitar el formulario.</p> : null}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-white">Identidad del equipo</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-300">Nombre del club *</label>
              <input name="club_name" required placeholder="Ej: Vóley Norte" className={fieldClass(Boolean(fieldErrors.club_name))} value={clubName} onChange={(event) => setClubName(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-300">Responsable *</label>
              <input name="responsible_name" required placeholder="Nombre y apellido" className={fieldClass(Boolean(fieldErrors.responsible_name))} />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <label className="text-xs text-slate-300">Correo de contacto *</label>
              <input name="contact_email" required type="email" placeholder="contacto@club.cl" className={fieldClass(Boolean(fieldErrors.contact_email))} />
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-white">Ubicación y cancha</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-300">Comuna o sector *</label>
              <input name="comuna" required placeholder="Comuna o sector" className={fieldClass(Boolean(fieldErrors.comuna))} />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-300">Dirección</label>
              <input name="address" placeholder="Dirección (opcional)" className="field" />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <label className="text-xs text-slate-300">¿Tienen cancha? *</label>
              <select name="has_court" required className={fieldClass(Boolean(fieldErrors.has_court))}>
                <option value="false">No tenemos cancha</option>
                <option value="true">Sí, ponemos cancha</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-white">Disponibilidad</h3>
          <div className="grid gap-3 rounded-2xl border border-slate-700 p-3">
            <p className="text-xs text-slate-300">Días disponibles *</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {weekdays.map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/30 px-2 py-2 text-sm text-slate-100">
                  <input type="checkbox" name="weekdays" value={day} className="h-4 w-4 accent-fuchsia-500" />
                  <span className="capitalize">{day}</span>
                </label>
              ))}
            </div>
            {fieldErrors.weekdays && <p className="text-xs text-rose-300">{fieldErrors.weekdays}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-300">Hora inicio *</label>
              <input name="start_time" required type="time" min="08:00" max="23:00" step={1800} className={fieldClass(Boolean(fieldErrors.start_time))} />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-300">Hora término *</label>
              <input name="end_time" required type="time" min="08:00" max="23:00" step={1800} className={fieldClass(Boolean(fieldErrors.end_time))} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Horario permitido: entre 08:00 y 23:00. La hora de término debe ser mayor a la de inicio.</p>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-white">Clasificación</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="age_category" required className={fieldClass(Boolean(fieldErrors.age_category))}>
              <option value="">Categoría etaria *</option>
              {ageCategories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select name="branch" required className={fieldClass(Boolean(fieldErrors.branch))}>
              <option value="">Rama *</option>
              <option value="femenina">Femenino</option>
              <option value="masculina">Masculino</option>
              <option value="mixta">Mixto</option>
            </select>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-white">Contacto y logo</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="phone" placeholder="Teléfono (opcional)" className="field" />
            <input name="instagram" placeholder="Instagram (usuario o URL)" className="field" />
            <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="field md:col-span-2 file:mr-2 file:rounded-lg file:border file:border-slate-500/80 file:bg-slate-900 file:px-3 file:py-2 file:text-slate-200" />
            <input name="logo_url" placeholder="o pega URL del logo (opcional)" className="field md:col-span-2" />
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-white">Extra</h3>
          <textarea name="notes" placeholder="Observaciones (opcional)" className="field min-h-24" />
        </section>
      </fieldset>

      <button type="submit" disabled={isPending || !userId} className="btn-accent w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto">
        {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
        {isPending ? 'Publicando...' : 'Publicar disponibilidad'}
      </button>

      {isPending && (
        <p className="text-sm text-slate-300" role="status" aria-live="polite">
          Estamos publicando tu disponibilidad, por favor espera...
        </p>
      )}

      {error && <p className="text-sm text-rose-300">{error}</p>}
    </form>
  );
}
