import 'server-only';

import {
  buildLiveSuggestedMatches,
  getSharedWeekdays,
  getTimeOverlapMinutes,
  USABLE_AVAILABILITY_STATUSES
} from '@/lib/matching';
import { getActiveBannedClubNameKeys, normalizeClubNameKey } from '@/lib/banned-clubs';
import { getSupabaseAdmin } from '@/lib/supabase';
import type {
  AvailabilityRow,
  AvailabilityWithTeam,
  ClubStatsCard,
  ClubStatsRow,
  MatchPhotoRow,
  MatchResultRow,
  SuggestedMatchCard,
  SuggestedMatchRow,
  TeamProfile,
  TeamRow
} from '@/lib/types';

export const HISTORY_MINIMUM = 3;

export interface AvailabilityFilters {
  branch?: string;
  weekday?: string;
  ageCategory?: string;
}

const HOME_DIAGNOSTIC_SAMPLE_LIMIT = 50;

function isMatchingDebugEnabled(): boolean {
  return String(process.env.DEBUG_MATCHING || '').trim().toLowerCase() === 'true';
}

function debugMatchingLog(message: string, payload: Record<string, unknown>) {
  if (!isMatchingDebugEnabled()) return;
  console.log(`[matching:debug] ${message}`, payload);
}

function normalizeStatus(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function shouldTreatAvailabilityAsOpen(status: unknown): boolean {
  const normalized = normalizeStatus(status);

  if (!normalized) return true;

  if (USABLE_AVAILABILITY_STATUSES.includes(normalized as (typeof USABLE_AVAILABILITY_STATUSES)[number])) {
    return true;
  }

  const closedStatuses = new Set([
    'closed',
    'archived',
    'cancelled',
    'canceled',
    'deleted',
    'completed',
    'matched',
    'expired',
    'inactive'
  ]);

  return !closedStatuses.has(normalized);
}

function summarizeStatusDistribution(rows: Array<{ status?: unknown }>): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = normalizeStatus(row?.status) || '(empty)';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export async function logHomeProductionDiagnostics(): Promise<{ suggestedMatchesCount: number } | null> {
  try {
    const supabase = getSupabaseAdmin();

    const [
      { count: availabilitiesCount, error: availCountError },
      { count: suggestedCount, error: suggestedCountError },
      { count: teamsCount, error: teamsCountError },
      { count: photosCount, error: photosCountError }
    ] = await Promise.all([
      supabase.from('availabilities').select('id', { count: 'exact', head: true }),
      supabase.from('suggested_matches').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('match_photos').select('id', { count: 'exact', head: true })
    ]);

    if (availCountError || suggestedCountError || teamsCountError || photosCountError) {
      console.error('[home:diagnostics] count query errors', {
        availCountError,
        suggestedCountError,
        teamsCountError,
        photosCountError
      });
    }

    const { data: availabilityRows, error: availabilityRowsError } = await supabase
      .from('availabilities')
      .select('id,status,branch,age_category,created_at')
      .order('created_at', { ascending: false })
      .limit(HOME_DIAGNOSTIC_SAMPLE_LIMIT);

    const statusDistribution = summarizeStatusDistribution((availabilityRows || []) as Array<{ status?: unknown }>);

    if (availabilityRowsError) {
      console.error('[home:diagnostics] availability sample query failed', availabilityRowsError);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseHost = (() => {
      try {
        return new URL(supabaseUrl).hostname;
      } catch {
        return '(invalid-url)';
      }
    })();

    const snapshot = {
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      vercelBranch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
      vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      nodeEnv: process.env.NODE_ENV || 'unknown',
      supabaseHost,
      availabilitiesCount: availabilitiesCount ?? null,
      suggestedMatchesCount: suggestedCount ?? null,
      teamsCount: teamsCount ?? null,
      matchPhotosCount: photosCount ?? null,
      availabilityStatusDistribution: statusDistribution
    };

    console.log('[home:diagnostics] runtime snapshot', snapshot);
    return { suggestedMatchesCount: Number(snapshot.suggestedMatchesCount ?? 0) };
  } catch (error) {
    console.error('[home:diagnostics] crashed', error);
    return null;
  }
}

function filterOutBannedAvailabilities(
  rows: AvailabilityWithTeam[],
  bannedClubNameKeys: Set<string>
): AvailabilityWithTeam[] {
  if (!bannedClubNameKeys.size) return rows;

  return rows.filter((row) => !bannedClubNameKeys.has(normalizeClubNameKey(row.club_name)));
}

export async function getOpenAvailabilities(limit = 18, filters?: AvailabilityFilters): Promise<AvailabilityWithTeam[]> {
  try {
    const supabase = getSupabaseAdmin();
    const bannedClubNameKeys = await getActiveBannedClubNameKeys(supabase);

    let query = supabase
      .from('availabilities')
      .select('*')
      .in('status', [...USABLE_AVAILABILITY_STATUSES])
      .order('created_at', { ascending: false });

    if (filters?.branch) {
      query = query.eq('branch', filters.branch);
    }

    if (filters?.weekday) {
      query = query.or(`weekday.eq.${filters.weekday},weekdays.cs.{${filters.weekday}}`);
    }

    if (filters?.ageCategory) {
      query = query.eq('age_category', filters.ageCategory);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('getOpenAvailabilities failed', error);
      return [];
    }

    const sourcePosts = (data || []) as AvailabilityWithTeam[];

    if (sourcePosts.length > 0) {
      return filterOutBannedAvailabilities(sourcePosts, bannedClubNameKeys);
    }

    const { data: fallbackRows, error: fallbackError } = await supabase
      .from('availabilities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit * 3);

    if (fallbackError) {
      console.error('getOpenAvailabilities fallback failed', fallbackError);
      return [];
    }

    const fallbackOpenRows = ((fallbackRows || []) as AvailabilityWithTeam[]).filter((row) =>
      shouldTreatAvailabilityAsOpen(row.status)
    );

    console.warn('getOpenAvailabilities recovered via fallback', {
      initialFilteredCount: sourcePosts.length,
      fallbackRowsCount: (fallbackRows || []).length,
      fallbackOpenRowsCount: fallbackOpenRows.length,
      availabilityStatusDistribution: summarizeStatusDistribution((fallbackRows || []) as Array<{ status?: unknown }>)
    });

    return filterOutBannedAvailabilities(fallbackOpenRows.slice(0, limit), bannedClubNameKeys);
  } catch (error) {
    console.error('getOpenAvailabilities crashed', error);
    return [];
  }
}

export async function getLiveSuggestedMatches(limit = 12): Promise<SuggestedMatchCard[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getLiveSuggestedMatches availabilities failed', error);
      return [];
    }

    const openRows = ((data || []) as AvailabilityWithTeam[]).filter((row) => shouldTreatAvailabilityAsOpen(row.status));
    const bannedClubNameKeys = await getActiveBannedClubNameKeys(supabase);
    const sourcePosts = filterOutBannedAvailabilities(openRows, bannedClubNameKeys);
    const { matches, stats } = buildLiveSuggestedMatches(sourcePosts, limit);

    console.log('[getLiveSuggestedMatches] total availabilities:', stats.totalAvailabilities);
    console.log('[getLiveSuggestedMatches] eligibles:', stats.eligibleAvailabilities);
    console.log('[getLiveSuggestedMatches] pares evaluados:', stats.pairsEvaluated);
    console.log('[getLiveSuggestedMatches] matches validos:', stats.validMatches);
    console.log('[getLiveSuggestedMatches] matches finales devueltos:', stats.returnedMatches);

    return matches;
  } catch (error) {
    console.error('getLiveSuggestedMatches crashed', error);
    return [];
  }
}

export async function getSuggestedMatches(limit = 12): Promise<SuggestedMatchCard[]> {
  return getSuggestedMatchesByStatus('active', limit);
}

export async function getMatchedSuggestedMatches(limit = 12): Promise<SuggestedMatchCard[]> {
  return getSuggestedMatchesByStatus('matched', limit);
}

export async function getCompletedSuggestedMatches(limit = 12): Promise<SuggestedMatchCard[]> {
  return getSuggestedMatchesByStatus('completed', limit);
}

async function getSuggestedMatchesByStatus(
  status: 'active' | 'matched' | 'completed',
  limit = 12
): Promise<SuggestedMatchCard[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: rows, error } = await supabase
      .from('suggested_matches')
      .select(
        'id,post_a_id,post_b_id,status,compatibility_score,schedule_score,location_score,level_score,elo_score,stream_url,stream_submitted_by_post_id,stream_submitted_at,created_at'
      )
      .eq('status', status)
      .order('compatibility_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Math.max(limit, 12))
      .returns<SuggestedMatchRow[]>();

    if (error) {
      console.error('getSuggestedMatches table lookup failed', error);
      return status === 'active' ? getLiveSuggestedMatches(limit) : [];
    }

    const selected = rows || [];

    console.log('[getSuggestedMatches] raw rows', selected.length);
    console.log('[getSuggestedMatches] selected', selected.length);

    if (!selected.length) {
      console.warn('getSuggestedMatchesByStatus empty', { status, limit });
      return status === 'active' ? getLiveSuggestedMatches(limit) : [];
    }

    const ids = Array.from(
      new Set(
        selected
          .flatMap((row) => [row.post_a_id, row.post_b_id])
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      )
    );

    console.log('[getSuggestedMatches] ids', ids);

    if (!ids.length) {
      console.error('[getSuggestedMatches] selected rows have no availability ids', {
        status,
        selected: selected.map((row) => ({
          id: row.id,
          post_a_id: row.post_a_id,
          post_b_id: row.post_b_id
        }))
      });

      return status === 'active' ? getLiveSuggestedMatches(limit) : [];
    }

    const { data: posts, error: postsError } = await supabase
      .from('availabilities')
      .select('*')
      .in('id', ids)
      .returns<AvailabilityWithTeam[]>();

    if (postsError) {
      console.error('getSuggestedMatches availabilities lookup failed', postsError);
      return status === 'active' ? getLiveSuggestedMatches(limit) : [];
    }

    const safePosts = (posts || []) as AvailabilityWithTeam[];
    const postsById = new Map(safePosts.map((post) => [post.id, post]));
    const discardedIds: string[] = [];
    const cards: SuggestedMatchCard[] = [];

    console.log('[getSuggestedMatches] posts found', safePosts.length);

    for (const row of selected) {
      const a = postsById.get(row.post_a_id);
      const b = postsById.get(row.post_b_id);

      if (!a || !b) {
        discardedIds.push(row.id);
        console.error('[getSuggestedMatches] discarded suggested match because a post is missing', {
          rowId: row.id,
          post_a_id: row.post_a_id,
          post_b_id: row.post_b_id,
          hasPostA: Boolean(a),
          hasPostB: Boolean(b),
          fetchedPostIds: safePosts.map((post) => post.id)
        });
        continue;
      }

      const sharedWeekdays = getSharedWeekdays(a, b);
      const overlapMinutes = getTimeOverlapMinutes(a, b);
      const compatibilityScore = Number(row.compatibility_score ?? 0);
      const scheduleScore = Number(row.schedule_score ?? 0);
      const locationScore = Number(row.location_score ?? 0);
      const levelScore = Number(row.level_score ?? 0);
      const eloScore = Number(row.elo_score ?? 0);

      cards.push({
        id: row.id,
        pairKey: `${row.post_a_id}::${row.post_b_id}`,
        status: row.status,
        totalScore: compatibilityScore,
        scheduleScore,
        locationScore,
        levelScore,
        eloScore,
        branch: a.branch,
        ageCategory: a.age_category,
        overlapMinutes,
        sharedWeekdays,
        a,
        b,
        breakdown: {
          base: 0,
          sameComuna: locationScore,
          courtAvailability: 0,
          overlapScore: scheduleScore,
          sharedDaysScore: 0,
          startTimeScore: 0,
          overlapMinutes,
          sharedWeekdays,
          startTimeDifferenceMinutes: Number.POSITIVE_INFINITY,
          totalBeforeClamp: compatibilityScore,
          items: []
        }
      });
    }

    console.log('[getSuggestedMatches] discarded', discardedIds);
    console.log('[getSuggestedMatches] renderable', cards.length);

    debugMatchingLog('suggested_matches final cards', {
      requestedStatus: status,
      selectedCount: selected.length,
      cardsCount: cards.length,
      discardedIds
    });

    if (!cards.length && status === 'active') {
      console.error('[getSuggestedMatches] active rows exist but no renderable cards were built; falling back to live matches', {
        selectedCount: selected.length,
        ids,
        postsFound: safePosts.length,
        discardedIds
      });

      return getLiveSuggestedMatches(limit);
    }

    return cards.slice(0, limit);
  } catch (error) {
    console.error('getSuggestedMatches crashed', error);
    return status === 'active' ? getLiveSuggestedMatches(limit) : [];
  }
}

export function getFeaturedSuggestedMatch(matches: SuggestedMatchCard[]): SuggestedMatchCard | null {
  return matches.length ? [...matches].sort((a, b) => b.totalScore - a.totalScore)[0] : null;
}

export function getRemainingSuggestedMatches(
  matches: SuggestedMatchCard[],
  featured: SuggestedMatchCard | null
): SuggestedMatchCard[] {
  if (!featured) return matches;
  return matches.filter((match) => match.id !== featured.id);
}

export async function getRecentMatchPhotos(limit = 12): Promise<MatchPhotoRow[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('match_photos')
      .select('*')
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<MatchPhotoRow[]>();

    if (error) {
      console.error('getRecentMatchPhotos failed', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getRecentMatchPhotos crashed', error);
    return [];
  }
}

export async function getClubStatsRanking(limit = 20): Promise<ClubStatsCard[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: stats, error } = await supabase
      .from('teams')
      .select('club_name, current_elo, matches_played, wins, losses, draws, updated_at')
      .order('wins', { ascending: false })
      .order('matches_played', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getClubStatsRanking teams fallback failed', error);
      return [];
    }

    const base = ((stats || []) as Array<{
      club_name: string;
      current_elo: number | null;
      matches_played: number | null;
      wins: number | null;
      losses: number | null;
      draws: number | null;
      updated_at: string | null;
    }>).map((team) => ({
      id: `${team.club_name}-${team.updated_at || 'na'}`,
      club_name: team.club_name,
      club_name_key: normalizeClubNameKey(team.club_name),
      matches_played: Number(team.matches_played || 0),
      wins: Number(team.wins || 0),
      losses: Number(team.losses || 0),
      last_match_date: null
    })) as ClubStatsRow[];

    if (!base.length) return [];

    const { data: photos, error: photosError } = await supabase
      .from('match_photos')
      .select('club_name_key, comuna, created_at')
      .in(
        'club_name_key',
        base.map((item) => item.club_name_key)
      )
      .order('created_at', { ascending: false });

    if (photosError) {
      console.error('getClubStatsRanking photos failed', photosError);
    }

    const comunaByClub = new Map<string, string>();

    for (const photo of photos || []) {
      if (!photo?.club_name_key || !photo?.comuna) continue;

      if (!comunaByClub.has(photo.club_name_key)) {
        comunaByClub.set(photo.club_name_key, photo.comuna);
      }
    }

    return base.map((item) => ({
      ...item,
      comuna: comunaByClub.get(item.club_name_key) || null,
      win_rate: item.matches_played > 0 ? Math.round((item.wins / item.matches_played) * 100) : 0
    }));
  } catch (error) {
    console.error('getClubStatsRanking crashed', error);
    return [];
  }
}

export async function getTopTeams(limit = 8): Promise<TeamRow[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('current_elo', { ascending: false })
      .order('matches_played', { ascending: false })
      .limit(limit)
      .returns<TeamRow[]>();

    if (error) {
      console.error('getTopTeams failed', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getTopTeams crashed', error);
    return [];
  }
}

export async function getRecentResults(limit = 10): Promise<MatchResultRow[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('match_photos')
      .select('*')
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<MatchPhotoRow[]>();

    if (error) {
      console.error('getRecentResults fallback failed', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      club_id: item.club_name_key || item.id,
      opponent_club_id: null,
      opponent_name: item.opponent_name,
      match_date: item.match_date,
      branch: 'mixta',
      match_type: 'amistoso',
      sets_won: 0,
      sets_lost: 0,
      set_scores: item.result,
      location: item.comuna,
      notes: item.comment,
      created_at: item.created_at,
      winner_club_id: null,
      proof_photo_url: item.image_url,
      elo_before: 0,
      elo_after: 0,
      elo_delta: 0
    })) as MatchResultRow[];
  } catch (error) {
    console.error('getRecentResults crashed', error);
    return [];
  }
}

export async function getTeamProfile(teamId: string): Promise<TeamProfile | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .maybeSingle<TeamRow>();

    if (teamError) {
      console.error('getTeamProfile team failed', teamError);
      return null;
    }

    if (!team) return null;

    const results: MatchResultRow[] = [];
    const winRate = team.matches_played > 0 ? Math.round((team.wins / team.matches_played) * 100) : 0;

    return {
      ...team,
      win_rate: winRate,
      latest_results: results || []
    };
  } catch (error) {
    console.error('getTeamProfile crashed', error);
    return null;
  }
}

export async function getAllTeamsMinimal(): Promise<TeamRow[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('club_name', { ascending: true })
      .returns<TeamRow[]>();

    if (error) {
      console.error('getAllTeamsMinimal failed', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getAllTeamsMinimal crashed', error);
    return [];
  }
}

export async function getAvailabilityById(id: string): Promise<AvailabilityWithTeam | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('getAvailabilityById failed', error);
      return null;
    }

    return (data as AvailabilityWithTeam | null) || null;
  } catch (error) {
    console.error('getAvailabilityById crashed', error);
    return null;
  }
}

export function toAvailabilityWithTeam(row: AvailabilityRow): AvailabilityWithTeam {
  return row;
}
