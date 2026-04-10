'use client';

import { useMemo, useState } from 'react';
import { createAvailability, uploadTeamLogo } from '@/app/actions';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const ageCategories = [
  { value: 'sub-12', label: 'Sub-12' },
  { value: 'sub-14', label: 'Sub-14' },
  { value: 'sub-16', label: 'Sub-16' },
  { value: 'sub-18', label: 'Sub-18' },
  { value: 'sub-20', label: 'Sub-20' },
  { value: 'tc', label: 'Todo Competidor (TC)' }
];

const requiredFields = [
  'club_name',
  'responsible_name',
  'contact_email',
  'comuna',
  'start_time',
  'end_time',
  'branch',
  'age_category',
  'has_court'
] as const;

type FieldErrors = Partial<Record<(typeof requiredFields)[number] | 'weekdays', string>>;

function fieldClass(hasError: boolean) {
  return `field ${hasError ? 'border-red-500 ring-2 ring-red-200 focus:border-red-600 focus:ring-red-200' : ''}`;
}

export default function PublishForm() {
  const [clubName, setClubName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const successClass = useMemo(() => (success ? 'text-sm text-emerald-700' : 'hidden'), [success]);

  return (
    <form
      action={async (formData) => {
        const nextErrors: FieldErrors = {};
        setError(null);
        setSuccess(null);

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
          setSuccess('¡Disponibilidad publicada! Ya aparece en equipos compatibles.');
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
        }
      }}
      className="card-panel grid gap-5 p-4 sm:p-6 md:p-7"
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Identidad</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <input
              name="club_name"
              required
              placeholder="Nombre del club"
              className={fieldClass(Boolean(fieldErrors.club_name))}
              value={clubName}
              onChange={(event) => setClubName(event.target.value)}
            />
          </div>
          <div>
            <input name="responsible_name" required placeholder="Responsable" className={fieldClass(Boolean(fieldErrors.responsible_name))} />
          </div>
          <div>
            <input name="contact_email" required type="email" placeholder="Correo de contacto" className={fieldClass(Boolean(fieldErrors.contact_email))} />
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Ubicación</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <input name="comuna" required placeholder="Comuna o sector" className={fieldClass(Boolean(fieldErrors.comuna))} />
          <input name="address" placeholder="Dirección (opcional)" className="field" />
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Cancha</h3>
        <select name="has_court" required className={fieldClass(Boolean(fieldErrors.has_court))}>
          <option value="false">No tenemos cancha</option>
          <option value="true">Sí, ponemos cancha</option>
        </select>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Disponibilidad</h3>
        <div className="grid gap-3 rounded-xl border border-line/80 p-3">
          <p className="text-xs text-muted">Días disponibles</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {weekdays.map((day) => (
              <label key={day} className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="weekdays" value={day} className="h-4 w-4" />
                <span className="capitalize">{day}</span>
              </label>
            ))}
          </div>
          {fieldErrors.weekdays && <p className="text-xs text-red-600">{fieldErrors.weekdays}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input name="start_time" required type="time" className={fieldClass(Boolean(fieldErrors.start_time))} />
          <input name="end_time" required type="time" className={fieldClass(Boolean(fieldErrors.end_time))} />
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Clasificación</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <select name="age_category" required className={fieldClass(Boolean(fieldErrors.age_category))}>
            <option value="">Categoría etaria</option>
            {ageCategories.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select name="branch" required className={fieldClass(Boolean(fieldErrors.branch))}>
            <option value="">Rama</option>
            <option value="femenina">Femenino</option>
            <option value="masculina">Masculino</option>
            <option value="mixta">Mixto</option>
          </select>
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Contacto y logo</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <input name="phone" placeholder="Teléfono (opcional)" className="field" />
          <input name="instagram" placeholder="Instagram (usuario o URL)" className="field" />
          <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="field md:col-span-2 file:mr-2 file:mt-1 file:rounded-lg file:border file:border-line file:bg-sand file:px-3 file:py-2 file:text-ink sm:file:mr-3 sm:file:mt-0" />
          <input name="logo_url" placeholder="o pega URL del logo (opcional)" className="field md:col-span-2" />
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Extra</h3>
        <textarea name="notes" placeholder="Observaciones (opcional)" className="field min-h-24" />
      </section>

      <button type="submit" className="btn-accent w-full justify-center md:w-auto">
        Publicar disponibilidad
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className={successClass}>{success}</p>
    </form>
  );
}
