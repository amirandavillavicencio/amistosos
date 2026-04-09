export type Branch = 'femenina' | 'masculina' | 'mixta';
export type Level = 'principiante' | 'intermedio' | 'avanzado';
export type MatchType = 'amistoso' | 'torneo' | 'entrenamiento' | 'competitivo';

export interface TeamRow {
  id: string;
  club_name: string;
  contact_email: string;
  instagram: string;
  comuna: string;
  city: string;
  branch: Branch;
  declared_level: Level;
  current_elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRow {
  id: string;
  team_id: string;
  address: string;
  comuna: string;
  city: string;
  play_date: string | null;
  weekday: string | null;
  start_time: string;
  end_time: string;
  branch: Branch;
  desired_level: Level;
  has_court: boolean;
  notes: string | null;
  status: 'open' | 'closed';
  created_at: string;
}

export interface AvailabilityWithTeam extends AvailabilityRow {
  team: TeamRow;
}

export interface SuggestedMatchRow {
  id: string;
  post_a_id: string;
  post_b_id: string;
  compatibility_score: number;
  schedule_score: number;
  location_score: number;
  level_score: number;
  elo_score: number;
  status: 'active' | 'archived';
  created_at: string;
}

export interface SuggestedMatchCard {
  id: string;
  totalScore: number;
  scheduleScore: number;
  locationScore: number;
  levelScore: number;
  eloScore: number;
  a: AvailabilityWithTeam;
  b: AvailabilityWithTeam;
}

export interface MatchResultRow {
  id: string;
  club_id: string;
  opponent_club_id: string | null;
  opponent_name: string | null;
  match_date: string;
  branch: Branch;
  match_type: MatchType;
  sets_won: number;
  sets_lost: number;
  set_scores: string | null;
  location: string | null;
  notes: string | null;
  elo_before: number;
  elo_after: number;
  elo_delta: number;
  created_at: string;
}

export interface TeamProfile extends TeamRow {
  win_rate: number;
  latest_results: MatchResultRow[];
}
