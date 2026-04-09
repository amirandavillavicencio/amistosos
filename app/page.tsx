import Link from 'next/link';
import PublishForm from '@/components/publish-form';
import PostCard from '@/components/post-card';
import { getSupabasePublic } from '@/lib/supabase';
import type { MatchCard, MatchRow, PostRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getPosts() {
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(12)
    .returns<PostRow[]>();
  return data || [];
}

async function getSuggestedMatches(posts: PostRow[]): Promise<MatchCard[]> {
  if (!posts.length) {
    return [];
  }

  const supabase = getSupabasePublic();
  const { data: rows } = await supabase
    .from('suggested_matches')
    .select('*')
    .eq('status', 'active')
    .order('compatibility_score', { ascending: false })
    .limit(10)
    .returns<MatchRow[]>();

  if (!rows || rows.length === 0) {
    return [];
  }

  const known = new Map(posts.map((post) => [post.id, post]));
  const missingIds = rows
    .flatMap((row) => [row.post_a_id, row.post_b_id])
    .filter((id) => !known.has(id));

  if (missingIds.length) {
    const { data: missingPosts } = await supabase
      .from('posts')
      .select('*')
      .in('id', [...new Set(missingIds)])
      .returns<PostRow[]>();

    for (const post of missingPosts || []) {
      known.set(post.id, post);
    }
  }

  return rows
    .map((row) => {
      const a = known.get(row.post_a_id);
      const b = known.get(row.post_b_id);
      if (!a || !b) {
        return null;
      }
      return {
        matchId: row.id,
        score: row.compatibility_score,
        a,
        b
      };
    })
    .filter((item): item is MatchCard => Boolean(item));
}

export default async function HomePage() {
  const posts = await getPosts();
  const suggestions = await getSuggestedMatches(posts);

  return (
    <main>
      <header className="section pb-8">
        <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <p className="text-lg font-semibold">Amistosos Vóley</p>
          <div className="flex gap-4 text-sm text-slate-300">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#publicar">Publicar</a>
            <a href="#matches">Coincidencias</a>
          </div>
        </nav>
      </header>

      <section className="section pt-2">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-accent/50 bg-accent/15 px-3 py-1 text-xs text-accent">
              Matchmaking público · Sin login
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Coordina amistosos de vóley en minutos, con sugerencias automáticas.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Publica tu disponibilidad, explora equipos y encuentra rivales compatibles por comuna,
              horario, rama, nivel y disponibilidad de cancha.
            </p>
            <div className="mt-8 flex gap-3">
              <a href="#publicar" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold">
                Publicar ahora
              </a>
              <a
                href="#publicaciones"
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200"
              >
                Ver publicaciones
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-panel/70 p-6 shadow-glow">
            <p className="text-sm text-muted">Estado del marketplace</p>
            <p className="mt-3 text-4xl font-bold">{posts.length}</p>
            <p className="text-sm text-slate-300">publicaciones abiertas</p>
            <p className="mt-6 text-4xl font-bold">{suggestions.length}</p>
            <p className="text-sm text-slate-300">matches sugeridos activos</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section pt-0">
        <h2 className="text-3xl font-semibold">Cómo funciona</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            '1) Publicas tu disponibilidad en menos de 1 minuto.',
            '2) El sistema cruza compatibilidad real con otras publicaciones.',
            '3) Contactas directo por correo o Instagram. Sin cuentas, sin clave.'
          ].map((text) => (
            <article key={text} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
              {text}
            </article>
          ))}
        </div>
      </section>

      <section id="publicaciones" className="section pt-0">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold">Publicaciones recientes</h2>
          <span className="text-sm text-muted">Abiertas para amistosos</span>
        </div>
        {posts.length === 0 ? (
          <p className="text-slate-400">Aún no hay publicaciones. ¡Sé el primero en publicar!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section id="publicar" className="section pt-0">
        <h2 className="mb-6 text-3xl font-semibold">Publica tu disponibilidad</h2>
        <PublishForm />
      </section>

      <section id="matches" className="section pt-0">
        <h2 className="text-3xl font-semibold">Coincidencias sugeridas</h2>
        <p className="mt-2 text-sm text-muted">
          Ranking automático según comuna, fecha/día, bloque horario, rama, nivel y cancha.
        </p>

        {suggestions.length === 0 ? (
          <p className="mt-6 text-slate-400">Todavía no hay sugerencias activas.</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {suggestions.map((match) => (
              <article key={match.matchId} className="rounded-2xl border border-white/10 bg-panel/80 p-5">
                <p className="text-xs uppercase tracking-wide text-accent">Compatibilidad {match.score}%</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {match.a.club_name} ↔ {match.b.club_name}
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  {match.a.comuna} · {match.a.start_time.slice(0, 5)}-{match.a.end_time.slice(0, 5)} ·{' '}
                  {match.a.branch}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link className="rounded-lg bg-white/10 px-3 py-2" href={`mailto:${match.a.contact_email}`}>
                    Mail {match.a.club_name}
                  </Link>
                  <a
                    className="rounded-lg bg-white/10 px-3 py-2"
                    href={`https://instagram.com/${match.b.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    IG {match.b.club_name}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section pt-0">
        <div className="rounded-3xl border border-accent/30 bg-accent/10 p-8 text-center">
          <h2 className="text-3xl font-semibold">¿Listo para cerrar tu próximo amistoso?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-200">
            Publica ahora y recibe matches potenciales al instante para coordinar por correo o Instagram.
          </p>
          <a href="#publicar" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold">
            Quiero publicar
          </a>
        </div>
      </section>

      <footer className="section pt-6">
        <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row">
          <p>Amistosos Vóley · MVP público sin autenticación obligatoria.</p>
          <p>Diseñado para publicar rápido y coordinar mejor.</p>
        </div>
      </footer>
    </main>
  );
}
