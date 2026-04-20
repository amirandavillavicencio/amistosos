import Link from 'next/link';
import { acceptSuggestedMatch } from '@/app/actions';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AvailabilityWithTeam } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface AcceptMatchPageProps {
  searchParams?: {
    postA?: string;
    postB?: string;
  };
}

function safeText(value: string | null | undefined, fallback: string): string {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

export default async function AcceptMatchPage({ searchParams }: AcceptMatchPageProps) {
  const resolved = searchParams || {};
  const postAId = String(resolved.postA || '').trim();
  const postBId = String(resolved.postB || '').trim();

  if (!postAId || !postBId || postAId === postBId) {
    return (
      <main className="section py-10">
        <article className="card-panel p-6 text-center">
          <h1 className="display-serif text-2xl text-ink">Match no disponible</h1>
          <p className="mt-2 text-sm text-muted">No encontramos los equipos para confirmar este amistoso.</p>
          <Link href="/" className="btn-secondary mt-4 inline-flex">Volver al inicio</Link>
        </article>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: posts, error } = await supabase
    .from('availabilities')
    .select('*')
    .in('id', [postAId, postBId])
    .returns<AvailabilityWithTeam[]>();

  if (error || !posts || posts.length !== 2) {
    return (
      <main className="section py-10">
        <article className="card-panel p-6 text-center">
          <h1 className="display-serif text-2xl text-ink">No pudimos cargar el match</h1>
          <p className="mt-2 text-sm text-muted">Puede que la disponibilidad ya no esté activa o haya sido editada.</p>
          <Link href="/" className="btn-secondary mt-4 inline-flex">Volver al inicio</Link>
        </article>
      </main>
    );
  }

  const byId = new Map(posts.map((post) => [post.id, post]));
  const teamA = byId.get(postAId) || posts[0];
  const teamB = byId.get(postBId) || posts[1];

  return (
    <main className="section py-8 sm:py-10">
      <article className="card-panel mx-auto max-w-3xl p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Confirmación de amistoso</p>
        <h1 className="mt-1 display-serif text-3xl text-ink">Aceptar match sugerido</h1>
        <p className="mt-2 text-sm text-muted">
          Revisa equipos y confirma correos de contacto para registrar este match como <strong>aceptado</strong>.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line/80 bg-paper/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Equipo A</p>
            <p className="mt-1 text-lg font-semibold text-ink">{safeText(teamA.club_name, 'Club no informado')}</p>
            <p className="text-sm text-muted">{safeText(teamA.comuna, 'Comuna no informada')}</p>
          </div>
          <div className="rounded-xl border border-line/80 bg-paper/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Equipo B</p>
            <p className="mt-1 text-lg font-semibold text-ink">{safeText(teamB.club_name, 'Club no informado')}</p>
            <p className="text-sm text-muted">{safeText(teamB.comuna, 'Comuna no informada')}</p>
          </div>
        </div>

        <form action={acceptSuggestedMatch} className="mt-6 space-y-4">
          <input type="hidden" name="website" value="" />
          <input type="hidden" name="post_a_id" value={teamA.id} />
          <input type="hidden" name="post_b_id" value={teamB.id} />

          <div>
            <label htmlFor="club_a_email" className="block text-sm font-medium text-ink">
              Correo de contacto · {safeText(teamA.club_name, 'Equipo A')}
            </label>
            <input
              id="club_a_email"
              name="club_a_email"
              type="email"
              required
              defaultValue={teamA.contact_email || ''}
              placeholder="equipoa@club.cl"
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="club_b_email" className="block text-sm font-medium text-ink">
              Correo de contacto · {safeText(teamB.club_name, 'Equipo B')}
            </label>
            <input
              id="club_b_email"
              name="club_b_email"
              type="email"
              required
              defaultValue={teamB.contact_email || ''}
              placeholder="equipob@club.cl"
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="btn-accent">Confirmar match</button>
            <Link href="/" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </article>
    </main>
  );
}
