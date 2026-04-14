import {
  adminArchiveManualMatch,
  adminBanClub,
  adminCloseAvailability,
  adminCreateManualMatch,
  adminUnbanClub,
  adminUpdateTeamRanking
} from '@/app/admin/actions';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AdminManualMatchRow, AvailabilityWithTeam, BannedClubRow, TeamRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface AdminPageProps {
  searchParams?: {
    section?: string;
    error?: string;
    notice?: string;
  };
}

function readSafeParam(value: string | undefined, fallback = ''): string {
  return String(value || '').trim() || fallback;
}

function formatTime(value: string | null | undefined): string {
  const raw = String(value || '').trim();
  return raw.length >= 5 ? raw.slice(0, 5) : '--:--';
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabase = getSupabaseAdmin();

  const [teamsQuery, postsQuery, manualMatchesQuery, bannedQuery] = await Promise.all([
    supabase
      .from('teams')
      .select('id, club_name, current_elo, matches_played, wins, losses, draws, created_at, updated_at')
      .order('current_elo', { ascending: false })
      .limit(40),
    supabase
      .from('availabilities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60),
    supabase
      .from('admin_manual_matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('banned_clubs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60)
  ]);

  if (teamsQuery.error) {
    console.error('AdminPage teams query failed', teamsQuery.error);
  }
  if (postsQuery.error) {
    console.error('AdminPage posts query failed', postsQuery.error);
  }
  if (manualMatchesQuery.error) {
    console.error('AdminPage manual matches query failed', manualMatchesQuery.error);
  }
  if (bannedQuery.error) {
    console.error('AdminPage banned clubs query failed', bannedQuery.error);
  }

  const teams = ((teamsQuery.data || []) as TeamRow[]).filter(Boolean);
  const posts = ((postsQuery.data || []) as AvailabilityWithTeam[]).filter(Boolean);
  const manualMatches = ((manualMatchesQuery.data || []) as AdminManualMatchRow[]).filter(Boolean);
  const bannedClubs = ((bannedQuery.data || []) as BannedClubRow[]).filter(Boolean);
  const openPosts = posts.filter((post) => ['open', 'active', 'published'].includes(String(post.status || '').toLowerCase()));

  const section = readSafeParam(searchParams?.section);
  const error = readSafeParam(searchParams?.error);
  const notice = readSafeParam(searchParams?.notice);

  return (
    <div className="space-y-10">
      {notice ? <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
      {error ? <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section id="ranking" className={`card-panel p-5 ${section === 'ranking' ? 'ring-2 ring-accent/30' : ''}`}>
        <h2 className="display-serif text-2xl text-ink">Ranking manual</h2>
        <p className="mt-1 text-sm text-muted">Edita ELO, partidos jugados, victorias, derrotas y empates.</p>
        {teams.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No hay equipos para editar.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {teams.map((team) => (
              <form key={team.id} action={adminUpdateTeamRanking} className="grid gap-2 rounded-lg border border-line/70 p-3 md:grid-cols-7">
                <input type="hidden" name="team_id" value={team.id} />
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-ink">{team.club_name}</p>
                  <p className="text-xs text-muted">ID: {team.id}</p>
                </div>
                <input name="current_elo" type="number" min={0} defaultValue={team.current_elo} className="field" />
                <input name="matches_played" type="number" min={0} defaultValue={team.matches_played} className="field" />
                <input name="wins" type="number" min={0} defaultValue={team.wins} className="field" />
                <input name="losses" type="number" min={0} defaultValue={team.losses} className="field" />
                <div className="flex gap-2">
                  <input name="draws" type="number" min={0} defaultValue={team.draws} className="field" />
                  <button type="submit" className="btn-accent whitespace-nowrap">
                    Guardar
                  </button>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>

      <section id="manual" className={`card-panel p-5 ${section === 'manual' ? 'ring-2 ring-accent/30' : ''}`}>
        <h2 className="display-serif text-2xl text-ink">Match manual</h2>
        <p className="mt-1 text-sm text-muted">Crea y archiva matches manuales para seguimiento administrativo.</p>
        <form action={adminCreateManualMatch} className="mt-4 grid gap-3 md:grid-cols-2">
          <select name="post_a_id" required className="field">
            <option value="">Publicacion A</option>
            {openPosts.map((post) => (
              <option key={`a-${post.id}`} value={post.id}>
                {post.club_name} | {post.branch} | {post.age_category} | {formatTime(post.start_time)}-{formatTime(post.end_time)}
              </option>
            ))}
          </select>
          <select name="post_b_id" required className="field">
            <option value="">Publicacion B</option>
            {openPosts.map((post) => (
              <option key={`b-${post.id}`} value={post.id}>
                {post.club_name} | {post.branch} | {post.age_category} | {formatTime(post.start_time)}-{formatTime(post.end_time)}
              </option>
            ))}
          </select>
          <textarea
            name="notes"
            className="field min-h-20 md:col-span-2"
            placeholder="Notas internas (opcional)"
            maxLength={280}
          />
          <button type="submit" className="btn-accent w-fit">
            Crear match manual
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {manualMatches.length === 0 ? (
            <p className="text-sm text-muted">No hay matches manuales.</p>
          ) : (
            manualMatches.map((match) => (
              <div key={match.id} className="rounded-lg border border-line/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {match.post_a_club_name} vs {match.post_b_club_name}
                  </p>
                  <p className="text-xs text-muted">
                    {match.status} | {match.created_at?.slice(0, 10) || ''}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Rama: {match.branch || 'n/a'} | Categoria: {match.age_category || 'n/a'} | Creado por: {match.created_by}
                </p>
                {match.notes ? <p className="mt-1 text-sm text-muted">Nota: {match.notes}</p> : null}
                {match.status === 'active' ? (
                  <form action={adminArchiveManualMatch} className="mt-2">
                    <input type="hidden" name="manual_match_id" value={match.id} />
                    <button type="submit" className="btn-secondary">
                      Archivar
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section id="posts" className={`card-panel p-5 ${section === 'posts' ? 'ring-2 ring-accent/30' : ''}`}>
        <h2 className="display-serif text-2xl text-ink">Publicaciones</h2>
        <p className="mt-1 text-sm text-muted">Cierra publicaciones desde servidor con confirmacion explicita.</p>
        <div className="mt-4 space-y-2">
          {posts.length === 0 ? (
            <p className="text-sm text-muted">No hay publicaciones registradas.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="rounded-lg border border-line/70 p-3">
                <p className="font-semibold text-ink">{post.club_name}</p>
                <p className="text-sm text-muted">
                  {post.branch} | {post.age_category} | {formatTime(post.start_time)}-{formatTime(post.end_time)} | estado:{' '}
                  {post.status}
                </p>
                <form action={adminCloseAvailability} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="availability_id" value={post.id} />
                  <input
                    name="confirm_word"
                    className="field w-40"
                    placeholder="Escribe CERRAR"
                    aria-label={`Confirmar cierre ${post.club_name}`}
                  />
                  <button type="submit" className="btn-secondary">
                    Cerrar publicacion
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <section id="bans" className={`card-panel p-5 ${section === 'bans' ? 'ring-2 ring-accent/30' : ''}`}>
        <h2 className="display-serif text-2xl text-ink">Clubes baneados</h2>
        <p className="mt-1 text-sm text-muted">Un club baneado no puede publicar y se excluye del matching live.</p>
        <form action={adminBanClub} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="club_name" className="field" required placeholder="Nombre del club a banear" maxLength={120} />
          <input name="reason" className="field" placeholder="Razon (opcional)" maxLength={280} />
          <button type="submit" className="btn-accent w-fit">
            Banear club
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {bannedClubs.length === 0 ? (
            <p className="text-sm text-muted">No hay clubes baneados activos.</p>
          ) : (
            bannedClubs.map((ban) => (
              <div key={ban.id} className="rounded-lg border border-line/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{ban.club_name}</p>
                  <p className="text-xs text-muted">{ban.created_at?.slice(0, 10) || ''}</p>
                </div>
                {ban.reason ? <p className="mt-1 text-sm text-muted">Razon: {ban.reason}</p> : null}
                <form action={adminUnbanClub} className="mt-2">
                  <input type="hidden" name="banned_id" value={ban.id} />
                  <button type="submit" className="btn-secondary">
                    Quitar baneo
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
