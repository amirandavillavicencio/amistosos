'use client';

import Link from 'next/link';
import { useAuthState } from '@/components/auth-controls';

export default function OwnerActions({ ownerId, postId }: { ownerId: string | null; postId: string }) {
  const { userId } = useAuthState();
  if (!ownerId || !userId || ownerId !== userId) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link href={`/publicaciones/${postId}/editar`} className="btn-accent">Editar disponibilidad</Link>
      <Link href="/explorar" className="btn-secondary">Ver más publicaciones</Link>
    </div>
  );
}
