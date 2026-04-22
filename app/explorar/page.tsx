import type { Metadata } from 'next';
import Link from 'next/link';
import ExplorarFilters from '@/components/explorar-filters';
import { PageHeader } from '@/components/ui-shell';
import { getOpenAvailabilities } from '@/lib/data';
import type { AvailabilityWithTeam } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explorar equipos | Amistosos Vóley',
  description: 'Filtra equipos por comuna, día, categoría, rama y disponibilidad de cancha para coordinar amistosos.'
};

export default async function ExplorarPage() {
  let posts: AvailabilityWithTeam[] = [];

  try {
    posts = await getOpenAvailabilities(120);
  } catch (error) {
    console.error('ExplorarPage data load failed', { route: '/explorar', error });
  }

  return (
    <main className="section">
      <PageHeader
        eyebrow="Explorar equipos"
        title="Disponibilidades abiertas"
        description="Usa filtros reactivos para encontrar rivales compatibles al instante."
        action={<Link href="/" className="btn-secondary">Volver al inicio</Link>}
      />

      <ExplorarFilters posts={posts} />
    </main>
  );
}
