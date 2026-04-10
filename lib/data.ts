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

export interface AvailabilityFilters {
  branch?: string;
  level?: string;
  weekday?: string;
  ageCategory?: string;
}

export async function getOpenAvailabilities(limit = 18, filters?: AvailabilityFilters): Promise<AvailabilityWithTeam[]> {
  try {
    const supabase = getSupabasePublic();
    let query = supabase
      .from('availabilities')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (filters?.branch) query = query.eq('branch', filters.branch);
    if (filters?.level) query = query.eq('level', filters.level);
    if (filters?.weekday) query = query.contains('weekdays', [filters.weekday]);
    if (filters?.ageCategory) query = query.eq('age_category', filters.ageCategory);

    const { data, error } = await query.limit(limit);
    if (error) {
      console.error('getOpenAvailabilities failed', error);
      return [];
    }

    return (data || []) as AvailabilityWithTeam[];
  } catch (error) {
    console.error('getOpenAvailabilities crashed', error);
    return [];
  }
}

export async function getSuggestedMatches(limit = 12): Promise<SuggestedMatchCard[]> {
  try {
    const supabase = getSupabasePublic();
    const { data: rows, error } = await supabase
      .from('suggested_matches')
      .select('*')
      .eq('status', 'active')
      .order('compatibility_score', { ascending: false })
      .limit(limit)
      .returns<SuggestedMatchRow[]>();

    if (error) {
      console.error('getSuggestedMatches failed', error);
      return [];
    }

    if (!rows?.length) return [];

    const ids = [...new Set(rows.flatMap((row) => [row.post_a_id, row.post_b_id]))];
    if (!ids.length) return [];

    const { data: availabilities, error: availabilitiesError } = await supabase
      .from('availabilities')
      .select('*')
      .in('id', ids);

    if (availabilitiesError) {
      console.error('getSuggestedMatches availabilities failed', availabilitiesError);
      return [];
    }

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
  } catch (error) {
    console.error('getSuggestedMatches crashed', error);
    return [];
  }
}

export async function getRecentMatchPhotos(limit = 12): Promise<MatchPhotoRow[]> {
  try {
    const supabase = getSupabasePublic();
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
    const supabase = getSupabasePublic();
    const { data: stats, error } = await supabase
      .from('club_stats')
      .select('*')
      .order('wins', { ascending: false })
      .order('matches_played', { ascending: false })
      .order('last_match_date', { ascending: false })
      .limit(limit)
      .returns<ClubStatsRow[]>();

    if (error) {
      console.error('getClubStatsRanking failed', error);
      return [];
    }

    const base = stats || [];
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
    const supabase = getSupabasePublic();
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
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .order('match_date', { ascending: false })
      .limit(limit)
      .returns<MatchResultRow[]>();
    if (error) {
      console.error('getRecentResults failed', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('getRecentResults crashed', error);
    return [];
  }
}

export async function getTeamProfile(teamId: string): Promise<TeamProfile | null> {
  try {
    const supabase = getSupabasePublic();
    const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', teamId).maybeSingle<TeamRow>();
    if (teamError) {
      console.error('getTeamProfile team failed', teamError);
      return null;
    }
    if (!team) return null;

    const { data: results, error: resultsError } = await supabase
      .from('match_results')
      .select('*')
      .eq('club_id', teamId)
      .order('match_date', { ascending: false })
      .limit(12)
      .returns<MatchResultRow[]>();

    if (resultsError) {
      console.error('getTeamProfile results failed', resultsError);
    }

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
    const supabase = getSupabasePublic();
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
    const supabase = getSupabasePublic();
    const { data, error } = await supabase.from('availabilities').select('*').eq('id', id).maybeSingle();
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
