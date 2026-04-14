import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminLogin } from '@/app/admin/actions';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

interface AdminLoginPageProps {
  searchParams?: {
    error?: string;
    notice?: string;
  };
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const session = await getAdminSession();
  if (session) {
    redirect('/admin');
  }

  const error = String(searchParams?.error || '').trim();
  const notice = String(searchParams?.notice || '').trim();

  return (
    <main className="section">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <p className="text-sm text-accent">Panel administrativo</p>
          <h1 className="display-serif text-4xl text-ink">Iniciar sesion</h1>
        </div>

        <form action={adminLogin} className="card-panel grid gap-4 p-5">
          <div className="grid gap-2">
            <label className="text-sm text-ink" htmlFor="admin-username">
              Usuario
            </label>
            <input id="admin-username" name="username" className="field" autoComplete="username" required />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-ink" htmlFor="admin-password">
              Clave
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              className="field"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn-accent justify-center">
            Entrar al panel
          </button>

          {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </form>

        <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
