'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'amistosos_onboarding_hidden_v1';

export default function HowItWorks() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === '1';
    setHidden(dismissed);
  }, []);

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        className="text-xs font-semibold text-fuchsia-200 underline underline-offset-4"
      >
        Ver ¿Cómo funciona?
      </button>
    );
  }

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, '1');
    setHidden(true);
  };

  return (
    <section className="app-card grid gap-4 p-4 sm:p-5">
      <div>
        <p className="app-eyebrow">Onboarding</p>
        <h2 className="app-title text-2xl">¿Cómo funciona?</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-3"><p className="text-2xl">📝</p><p className="mt-2 text-sm text-slate-200">1. Publica la disponibilidad de tu equipo</p></article>
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-3"><p className="text-2xl">🤝</p><p className="mt-2 text-sm text-slate-200">2. Recibe propuestas de equipos compatibles</p></article>
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-3"><p className="text-2xl">🏐</p><p className="mt-2 text-sm text-slate-200">3. Coordina y ¡a jugar!</p></article>
      </div>
      <div>
        <button type="button" className="btn-secondary" onClick={dismiss}>Ya entendí</button>
      </div>
    </section>
  );
}
