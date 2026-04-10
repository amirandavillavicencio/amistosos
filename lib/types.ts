export type Branch = 'femenina' | 'masculina' | 'mixta';
export type AgeCategory = 'sub-12' | 'sub-14' | 'sub-16' | 'sub-18' | 'sub-20' | 'tc';
export type Level = 'principiante' | 'novato' | 'intermedio' | 'avanzado' | 'competitivo';
export type MatchType = 'amistoso' | 'torneo' | 'entrenamiento' | 'competitivo';

export interface TeamRow {
  id: string;
  club_name: string;
  responsible_name: string;
  contact_email: string;
  instagram: string;
  comuna: string;
  city: string;
  branch: Branch;
  age_category: AgeCategory;
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
  club_name: string;
  comuna: string;
  city: string;
  weekday: string | null;
  weekdays: string[];
  start_time: string;
  end_time: string;
  branch: Branch;
  age_category: AgeCategory;
  level: Level | null;
  has_court: boolean;
  notes: string | null;
  status: 'open' | 'closed';
  created_at: string;
  contact_email: string | null;
  responsible_name: string | null;
  phone: string | null;
  instagram: string | null;
  logo_url: string | null;
}

export type AvailabilityWithTeam = AvailabilityRow;

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

export interface MatchPhotoRow {
  id: string;
  club_name: string;
  club_name_key: string;
  opponent_name: string;
  match_date: string;
  comuna: string;
  result: string | null;
  comment: string | null;
  image_url: string;
  created_at: string;
}

export interface ClubStatsRow {
  id: string;
  club_name: string;
  club_name_key: string;
  matches_played: number;
  wins: number;
  losses: number;
  last_match_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubStatsCard extends ClubStatsRow {
  comuna: string | null;
  win_rate: number;
}
