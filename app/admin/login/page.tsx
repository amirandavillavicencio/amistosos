import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminLogin } from '@/app/admin/actions';
import { PageHeader, SectionShell } from '@/components/ui-shell';
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
        <PageHeader eyebrow="Panel administrativo" title="Iniciar sesión" />

        <SectionShell>
          <form action={adminLogin} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm text-slate-200" htmlFor="admin-username">Usuario</label>
              <input id="admin-username" name="username" className="field" autoComplete="username" required />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-slate-200" htmlFor="admin-password">Clave</label>
              <input id="admin-password" name="password" type="password" className="field" autoComplete="current-password" required />
            </div>

            <button type="submit" className="btn-accent justify-center">Entrar al panel</button>
            {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </form>
        </SectionShell>

        <Link href="/" className="mt-4 inline-block text-sm text-fuchsia-200 hover:underline">Volver al inicio</Link>
      </div>
    </main>
  );
}
