'use client';

import { useMemo, useState } from 'react';
import { createAvailability } from '@/app/actions';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const requiredFields = [
  'club_name',
  'contact_email',
  'instagram',
  'address',
  'comuna',
  'city',
  'start_time',
  'end_time',
  'branch',
  'level',
  'has_court'
] as const;

type FieldErrors = Partial<Record<(typeof requiredFields)[number] | 'play_date_weekday', string>>;

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

        const playDate = String(formData.get('play_date') || '').trim();
        const weekday = String(formData.get('weekday') || '').trim();
        if (!playDate && !weekday) {
          nextErrors.play_date_weekday = 'Debes ingresar fecha específica o día de la semana.';
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          setError('Revisa los campos marcados en rojo.');
          return;
        }

        setFieldErrors({});

        try {
          await createAvailability(formData);
          setClubName('');
          setSuccess('¡Disponibilidad publicada! Ya aparece en equipos disponibles.');
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
        }
      }}
      className="card-panel grid gap-5 p-4 sm:p-6 md:p-7"
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <input
            name="club_name"
            required
            placeholder="Nombre del club o equipo"
            className={fieldClass(Boolean(fieldErrors.club_name))}
            value={clubName}
            onChange={(event) => setClubName(event.target.value)}
          />
          {fieldErrors.club_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.club_name}</p>}
        </div>
        <div>
          <input name="contact_email" required type="email" placeholder="Correo de contacto" className={fieldClass(Boolean(fieldErrors.contact_email))} />
          {fieldErrors.contact_email && <p className="mt-1 text-xs text-red-600">{fieldErrors.contact_email}</p>}
        </div>
        <div>
          <input name="instagram" required placeholder="Instagram (@equipo)" className={fieldClass(Boolean(fieldErrors.instagram))} />
          {fieldErrors.instagram && <p className="mt-1 text-xs text-red-600">{fieldErrors.instagram}</p>}
        </div>
        <div>
          <input name="address" required placeholder="Dirección" className={fieldClass(Boolean(fieldErrors.address))} />
          {fieldErrors.address && <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>}
        </div>
        <div>
          <input name="comuna" required placeholder="Comuna" className={fieldClass(Boolean(fieldErrors.comuna))} />
          {fieldErrors.comuna && <p className="mt-1 text-xs text-red-600">{fieldErrors.comuna}</p>}
        </div>
        <div>
          <input name="city" required placeholder="Ciudad" className={fieldClass(Boolean(fieldErrors.city))} />
          {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
        </div>
        <div>
          <input name="play_date" type="date" className={fieldClass(Boolean(fieldErrors.play_date_weekday))} />
        </div>
        <div>
          <select name="weekday" className={fieldClass(Boolean(fieldErrors.play_date_weekday))}>
            <option value="">Día de la semana (opcional)</option>
            {weekdays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {fieldErrors.play_date_weekday && <p className="mt-1 text-xs text-red-600">{fieldErrors.play_date_weekday}</p>}
        </div>
        <div>
          <input name="start_time" required type="time" className={fieldClass(Boolean(fieldErrors.start_time))} />
          {fieldErrors.start_time && <p className="mt-1 text-xs text-red-600">{fieldErrors.start_time}</p>}
        </div>
        <div>
          <input name="end_time" required type="time" className={fieldClass(Boolean(fieldErrors.end_time))} />
          {fieldErrors.end_time && <p className="mt-1 text-xs text-red-600">{fieldErrors.end_time}</p>}
        </div>
        <div>
          <select name="branch" required className={fieldClass(Boolean(fieldErrors.branch))}>
            <option value="">Rama</option>
            <option value="femenina">Femenina</option>
            <option value="masculina">Masculina</option>
            <option value="mixta">Mixta</option>
          </select>
          {fieldErrors.branch && <p className="mt-1 text-xs text-red-600">{fieldErrors.branch}</p>}
        </div>
        <div>
          <select name="level" required className={fieldClass(Boolean(fieldErrors.level))}>
            <option value="">Nivel declarado</option>
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
          {fieldErrors.level && <p className="mt-1 text-xs text-red-600">{fieldErrors.level}</p>}
        </div>
        <div className="md:col-span-2">
          <select name="has_court" required className={fieldClass(Boolean(fieldErrors.has_court))}>
            <option value="false">¿Pones cancha? No</option>
            <option value="true">¿Pones cancha? Sí</option>
          </select>
          {fieldErrors.has_court && <p className="mt-1 text-xs text-red-600">{fieldErrors.has_court}</p>}
        </div>
      </div>

      <textarea
        name="notes"
        placeholder="Observaciones: tipo de balón, máximo de sets, estacionamiento, etc."
        className="field min-h-24"
      />

      <button type="submit" className="btn-accent w-full justify-center md:w-auto">
        Publicar disponibilidad
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className={successClass}>{success}</p>
    </form>
  );
}
