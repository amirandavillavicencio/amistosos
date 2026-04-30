import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BackHomeLink from '@/components/back-home-link';
import OwnerActions from '@/components/owner-actions';
import TeamAvatar from '@/components/team-avatar';
import { SectionShell, StatusBadge } from '@/components/ui-shell';
import { getAvailabilityById } from '@/lib/data';
import { capitalize, formatBranch, formatCategory, formatComuna } from '@/lib/presentation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getAvailabilityById(params.id);
  if (!post) return { title: 'Publicación no encontrada | Amistosos Vóley' };

  const days = (post.weekdays || (post.weekday ? [post.weekday] : [])).map((day) => capitalize(day)).join(', ');
  const description = `${formatComuna(post.comuna)} · ${days || 'Sin días'} · ${post.start_time?.slice(0, 5)}-${post.end_time?.slice(0, 5)} · ${formatCategory(post.age_category)}`;
  const url = `https://amistosos.vercel.app/publicaciones/${post.id}`;

  return {
    title: `${post.club_name} | Amistosos Vóley`,
    description,
    openGraph: { title: post.club_name, description, url },
    twitter: { card: 'summary_large_image', title: post.club_name, description }
  };
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200">
      <span aria-hidden="true">{icon}</span>
      <p>
        <span className="font-semibold text-slate-100">{label}: </span>
        <span>{value}</span>
      </p>
    </div>
  );
}

export default async function PublicacionDetallePage({ params }: { params: { id: string } }) {
  const post = await getAvailabilityById(params.id);
  if (!post) return notFound();
  const isActive = ['open', 'active', 'published'].includes(String(post.status || '').toLowerCase());
  const weekdays = Array.isArray(post.weekdays) ? post.weekdays : post.weekday ? [post.weekday] : [];

  return (
    <main className="section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/explorar" className="editorial-link">← Volver a publicaciones</Link>
        <BackHomeLink />
      </div>

      <SectionShell className="mt-4">
        <p className="app-eyebrow">Detalle de disponibilidad</p>

        <header className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TeamAvatar name={post.club_name} logoUrl={post.logo_url} sizeClassName="h-12 w-12" />
            <h1 className="app-title text-3xl sm:text-4xl">{post.club_name}</h1>
          </div>
          <StatusBadge tone={isActive ? 'accent' : 'neutral'}>
            {isActive ? 'Publicación activa' : 'Publicación desactivada'}
          </StatusBadge>
        </header>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full border border-slate-500/60 bg-slate-800/70 px-2 py-0.5 text-slate-100">{formatComuna(post.comuna)}</span>
          <span className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2 py-0.5 text-sky-100">{formatCategory(post.age_category)}</span>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-100">{formatBranch(post.branch)}</span>
          <span className={`rounded-full border px-2 py-0.5 ${post.has_court ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100' : 'border-slate-500/60 bg-slate-800/70 text-slate-200'}`}>
            {post.has_court ? '✓ Pone cancha' : '✗ Sin cancha'}
          </span>
        </div>

        <section className="mt-4 grid gap-2.5">
          <DetailRow icon="📍" label="Comuna" value={formatComuna(post.comuna)} />
          <DetailRow icon="🕒" label="Horario" value={`${post.start_time?.slice(0, 5) || '--:--'} - ${post.end_time?.slice(0, 5) || '--:--'}`} />
          <DetailRow icon="📅" label="Días" value={weekdays.length ? weekdays.map((day) => capitalize(day)).join(', ') : 'Sin días informados'} />
          <DetailRow icon="🏐" label="Categoría" value={formatCategory(post.age_category)} />
          <DetailRow icon="👥" label="Rama" value={formatBranch(post.branch)} />
          <DetailRow icon="🏟️" label="Cancha" value={post.has_court ? 'Pone cancha' : 'Sin cancha'} />
        </section>

        {post.instagram ? (
          <section className="mt-4 rounded-2xl border border-fuchsia-300/40 bg-fuchsia-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-fuchsia-200">Contacto</p>
            <a
              href={post.instagram.startsWith('http') ? post.instagram : `https://instagram.com/${post.instagram.replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-100 hover:underline"
            >
              <span aria-hidden="true">📸</span>
              {post.instagram}
            </a>
          </section>
        ) : null}

        {post.notes ? <p className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/50 p-3 text-sm text-slate-200">{post.notes}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-accent" aria-label="Proponer cruce próximamente">
            Proponer cruce
          </button>
          <Link href="/explorar" className="btn-secondary">Ver más publicaciones</Link>
        </div>

        <OwnerActions ownerId={post.owner_id} postId={post.id} />
      </SectionShell>
    </main>
  );
}
