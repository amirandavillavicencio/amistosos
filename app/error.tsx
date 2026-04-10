'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error boundary', {
      message: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <main className="section">
      <div className="card-panel mx-auto max-w-2xl p-6 text-center sm:p-8">
        <p className="text-sm text-accent">Ocurrió un problema</p>
        <h1 className="display-serif mt-2 text-3xl text-ink sm:text-4xl">No pudimos cargar esta página</h1>
        <p className="mt-3 text-sm text-muted">Intenta nuevamente en unos segundos.</p>
        {error.digest && <p className="mt-2 text-xs text-muted">Código: {error.digest}</p>}
        <button type="button" onClick={reset} className="btn-accent mx-auto mt-6">
          Reintentar
        </button>
      </div>
    </main>
  );
}
