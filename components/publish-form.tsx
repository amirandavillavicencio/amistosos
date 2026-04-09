'use client';

import { useState } from 'react';
import { createPost } from '@/app/actions';

const weekdays = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo'
];

export default function PublishForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSuccess(null);
        try {
          await createPost(formData);
          setSuccess('¡Publicación creada! Ya aparece en el listado y en sugerencias.');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
        }
      }}
      className="grid gap-4 rounded-2xl border border-white/10 bg-panel/70 p-6 shadow-glow"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <input name="club_name" required placeholder="Nombre del club o equipo" className="field" />
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
          <option value="">Nivel</option>
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

      <button
        type="submit"
        className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Publicar disponibilidad
      </button>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {success && <p className="text-sm text-emerald-300">{success}</p>}
    </form>
  );
}
