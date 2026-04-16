import Link from 'next/link';
import PublishForm from '@/components/publish-form';
import { PageHeader } from '@/components/ui-shell';

export const dynamic = 'force-dynamic';

export default function PublicarPage() {
  return (
    <main className="section">
      <PageHeader
        eyebrow="Nueva publicación"
        title="Publicar disponibilidad"
        description="Completa el formulario con datos reales para recibir propuestas compatibles de otros clubes."
        action={<Link href="/" className="btn-secondary">Volver al inicio</Link>}
      />
      <PublishForm />
    </main>
  );
}
