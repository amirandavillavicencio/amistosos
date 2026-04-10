'use client';

import { useEffect } from 'react';

export default function RankingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Ranking error boundary', {
      message: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <main className="section">
      <div className="card-panel mx-auto max-w-2xl p-6 text-center sm:p-8">
        <p className="text-sm text-accent">Ranking no disponible</p>
        <h1 className="display-serif mt-2 text-3xl text-ink sm:text-4xl">No pudimos cargar la tabla</h1>
        <p className="mt-3 text-sm text-muted">Puedes reintentar o volver más tarde.</p>
        {error.digest && <p className="mt-2 text-xs text-muted">Código: {error.digest}</p>}
        <button type="button" onClick={reset} className="btn-accent mx-auto mt-6">
          Reintentar
        </button>
      </div>
    </main>
  );
}
