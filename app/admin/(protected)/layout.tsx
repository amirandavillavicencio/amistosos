import { redirect } from 'next/navigation';
import { adminLogout } from '@/app/admin/actions';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login?error=Sesion%20expirada.%20Inicia%20sesion%20nuevamente.');
  }

  return (
    <main className="section">
      <header className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-accent">Administracion</p>
          <h1 className="display-serif text-4xl text-ink sm:text-5xl">Panel admin</h1>
          <p className="mt-1 text-sm text-muted">Sesion activa: {session.username}</p>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="btn-secondary">
            Cerrar sesion
          </button>
        </form>
      </header>

      {children}
    </main>
  );
}
