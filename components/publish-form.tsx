'use client';

import { useState } from 'react';
import { createAvailability } from '@/app/actions';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export default function PublishForm() {
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSuccess(null);
        try {
          await createAvailability(formData);
          setClubName('');
          setSuccess('¡Disponibilidad publicada! Ya aparece en equipos disponibles.');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
        }
      }}
      className="card-panel grid gap-5 p-6 md:p-7"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="club_name"
          required
          placeholder="Nombre del club o equipo"
          className="field"
          value={clubName}
          onChange={(event) => setClubName(event.target.value)}
        />
        <input name="contact_email" required type="email" placeholder="Correo de contacto" className="field" />
        <input name="instagram" required placeholder="Instagram (@equipo)" className="field" />
        <input name="address" required placeholder="Dirección" className="field" />
        <input name="comuna" required placeholder="Comuna" className="field" />
        <input name="city" required placeholder="Ciudad" className="field" />
        <input name="play_date" type="date" className="field" />
        <select name="weekday" className="field">
          <option value="">Día de la semana (opcional)</option>
          {weekdays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <input name="start_time" required type="time" className="field" />
        <input name="end_time" required type="time" className="field" />
        <select name="branch" required className="field">
          <option value="">Rama</option>
          <option value="femenina">Femenina</option>
          <option value="masculina">Masculina</option>
          <option value="mixta">Mixta</option>
        </select>
        <select name="level" required className="field">
          <option value="">Nivel declarado</option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
        <select name="has_court" required className="field md:col-span-2">
          <option value="false">¿Pones cancha? No</option>
          <option value="true">¿Pones cancha? Sí</option>
        </select>
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
      {success && <p className="text-sm text-emerald-700">{success}</p>}
    </form>
  );
}
