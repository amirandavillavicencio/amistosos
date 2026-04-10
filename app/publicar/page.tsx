import Link from 'next/link';
import PublishForm from '@/components/publish-form';

export const dynamic = 'force-dynamic';

export default function PublicarPage() {
  return (
    <main className="section">
      <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-accent">Nueva publicación</p>
          <h1 className="display-serif text-4xl text-ink sm:text-5xl">Publicar disponibilidad</h1>
        </div>
        <Link href="/" className="rounded-xl border border-line bg-ivory px-4 py-2 text-sm text-ink">
          Volver al inicio
        </Link>
      </div>

      <PublishForm />
    </main>
  );
}
