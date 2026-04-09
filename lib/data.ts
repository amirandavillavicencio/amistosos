import { getSupabasePublic } from '@/lib/supabase';
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

export async function getOpenAvailabilities(limit = 18): Promise<AvailabilityWithTeam[]> {
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('availabilities')
    .select('*, team:teams(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data || []) as AvailabilityWithTeam[]).filter((row) => Boolean(row.team));
}

export async function getSuggestedMatches(limit = 12): Promise<SuggestedMatchCard[]> {
  const supabase = getSupabasePublic();
  const { data: rows } = await supabase
    .from('suggested_matches')
    .select('*')
    .eq('status', 'active')
    .order('compatibility_score', { ascending: false })
    .limit(limit)
    .returns<SuggestedMatchRow[]>();

  if (!rows?.length) return [];

  const ids = [...new Set(rows.flatMap((row) => [row.post_a_id, row.post_b_id]))];
  const { data: availabilities } = await supabase
    .from('availabilities')
    .select('*, team:teams(*)')
    .in('id', ids);

  const map = new Map<string, AvailabilityWithTeam>();
  for (const row of (availabilities || []) as AvailabilityWithTeam[]) {
    map.set(row.id, row);
  }

  return rows
    .map((row) => {
      const a = map.get(row.post_a_id);
      const b = map.get(row.post_b_id);
      if (!a || !b) return null;
      return {
        id: row.id,
        totalScore: row.compatibility_score,
        scheduleScore: row.schedule_score,
        locationScore: row.location_score,
        levelScore: row.level_score,
        eloScore: row.elo_score,
        a,
        b
      };
    })
    .filter((value): value is SuggestedMatchCard => Boolean(value));
}

export async function getRecentMatchPhotos(limit = 12): Promise<MatchPhotoRow[]> {
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('match_photos')
    .select('*')
    .order('match_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<MatchPhotoRow[]>();

  return data || [];
}

export async function getClubStatsRanking(limit = 20): Promise<ClubStatsCard[]> {
  const supabase = getSupabasePublic();
  const { data: stats } = await supabase
    .from('club_stats')
    .select('*')
    .order('wins', { ascending: false })
    .order('matches_played', { ascending: false })
    .order('last_match_date', { ascending: false })
    .limit(limit)
    .returns<ClubStatsRow[]>();

  const base = stats || [];
  if (!base.length) return [];

  const { data: photos } = await supabase
    .from('match_photos')
    .select('club_name_key, comuna, created_at')
    .in(
      'club_name_key',
      base.map((item) => item.club_name_key)
    )
    .order('created_at', { ascending: false });

  const comunaByClub = new Map<string, string>();
  for (const photo of photos || []) {
    if (!comunaByClub.has(photo.club_name_key)) {
      comunaByClub.set(photo.club_name_key, photo.comuna);
    }
  }

  return base.map((item) => ({
    ...item,
    comuna: comunaByClub.get(item.club_name_key) || null,
    win_rate: item.matches_played > 0 ? Math.round((item.wins / item.matches_played) * 100) : 0
  }));
}

export async function getTopTeams(limit = 8): Promise<TeamRow[]> {
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('teams')
    .select('*')
    .order('current_elo', { ascending: false })
    .order('matches_played', { ascending: false })
    .limit(limit)
    .returns<TeamRow[]>();

  return data || [];
}

export async function getRecentResults(limit = 10): Promise<MatchResultRow[]> {
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('match_results')
    .select('*')
    .order('match_date', { ascending: false })
    .limit(limit)
    .returns<MatchResultRow[]>();

  return data || [];
}

export async function getTeamProfile(teamId: string): Promise<TeamProfile | null> {
  const supabase = getSupabasePublic();
  const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).maybeSingle<TeamRow>();
  if (!team) return null;

  const { data: results } = await supabase
    .from('match_results')
    .select('*')
    .eq('club_id', teamId)
    .order('match_date', { ascending: false })
    .limit(12)
    .returns<MatchResultRow[]>();

  const winRate = team.matches_played > 0 ? Math.round((team.wins / team.matches_played) * 100) : 0;

  return {
    ...team,
    win_rate: winRate,
    latest_results: results || []
  };
}

export async function getAllTeamsMinimal(): Promise<TeamRow[]> {
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('teams')
    .select('*')
    .order('club_name', { ascending: true })
    .returns<TeamRow[]>();
  return data || [];
}

export async function getAvailabilityById(id: string): Promise<AvailabilityWithTeam | null> {
  const supabase = getSupabasePublic();
  const { data } = await supabase.from('availabilities').select('*, team:teams(*)').eq('id', id).maybeSingle();
  return (data as AvailabilityWithTeam | null) || null;
}

export function toAvailabilityWithTeam(row: AvailabilityRow & { team: TeamRow }): AvailabilityWithTeam {
  return row;
}
