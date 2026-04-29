export type Branch = 'femenina' | 'masculina' | 'mixta';
export type AgeCategory = 'sub-12' | 'sub-14' | 'sub-16' | 'sub-18' | 'sub-20' | 'tc';
export type Level = 'principiante' | 'novato' | 'intermedio' | 'avanzado' | 'competitivo';
export type MatchType = 'amistoso' | 'torneo' | 'entrenamiento' | 'competitivo';
export type AvailabilityStatus = 'open' | 'active' | 'published' | 'closed' | 'archived' | (string & {});

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
  weekdays: string[] | null;
  start_time: string;
  end_time: string;
  branch: Branch;
  age_category: AgeCategory;
  level: Level | null;
  has_court: boolean;
  notes: string | null;
  status: AvailabilityStatus;
  created_at: string;
  contact_email: string | null;
  responsible_name: string | null;
  phone: string | null;
  instagram: string | null;
  logo_url: string | null;
  owner_id: string | null;
}

export type AvailabilityWithTeam = AvailabilityRow;
export type MatchingAvailability = AvailabilityWithTeam;

export interface SuggestedMatchRow {
  id: string;
  post_a_id: string;
  post_b_id: string;
  compatibility_score: number;
  schedule_score: number;
  location_score: number;
  level_score: number;
  elo_score: number;
  status: 'active' | 'matched' | 'completed' | 'archived' | 'expired' | 'unconfirmed';
  stream_url?: string | null;
  stream_submitted_by_post_id?: string | null;
  stream_submitted_at?: string | null;
  created_at: string;
}

export interface MatchIntentRow {
  id: string;
  from_post_id: string;
  to_post_id: string;
  created_at: string;
}

export interface ConfirmedMatchRow {
  id: string;
  post_a_id: string;
  post_b_id: string;
  club_a_email: string | null;
  club_b_email: string | null;
  created_at: string;
  status: 'suggested' | 'pending' | 'accepted' | 'confirmed' | 'played';
}

export interface MatchConversationRow {
  id: string;
  match_id: string;
  club_a_email: string;
  club_b_email: string;
  status: 'active' | 'closed';
  created_at: string;
}

export interface MatchMessageRow {
  id: string;
  conversation_id: string;
  sender_email: string;
  message_text: string;
  created_at: string;
}

export interface SuggestedMatchBreakdownItem {
  key: 'base' | 'sameComuna' | 'courtAvailability' | 'overlapScore' | 'sharedDaysScore' | 'startTimeScore';
  label: string;
  points: number;
  detail?: string;
}

export interface SuggestedMatchScoreBreakdown {
  base: number;
  sameComuna: number;
  courtAvailability: number;
  overlapScore: number;
  sharedDaysScore: number;
  startTimeScore: number;
  overlapMinutes: number;
  sharedWeekdays: string[];
  startTimeDifferenceMinutes: number;
  totalBeforeClamp: number;
  items: SuggestedMatchBreakdownItem[];
}

export interface SuggestedMatchInsertRow {
  post_a_id: string;
  post_b_id: string;
  compatibility_score: number;
  schedule_score: number;
  location_score: number;
  level_score: number;
  elo_score: number;
  status: 'active';
}

export interface SuggestedMatchCard {
  id: string;
  pairKey: string;
  status: 'active' | 'matched' | 'completed' | 'archived' | 'expired' | 'unconfirmed';
  streamUrl?: string | null;
  streamSubmittedByPostId?: string | null;
  streamSubmittedAt?: string | null;
  totalScore: number;
  scheduleScore: number;
  locationScore: number;
  levelScore: number;
  eloScore: number;
  branch: Branch;
  ageCategory: AgeCategory;
  overlapMinutes: number;
  sharedWeekdays: string[];
  a: AvailabilityWithTeam;
  b: AvailabilityWithTeam;
  breakdown: SuggestedMatchScoreBreakdown;
}

export interface SuggestedMatchBuildStats {
  totalAvailabilities: number;
  eligibleAvailabilities: number;
  pairsEvaluated: number;
  validMatches: number;
  returnedMatches: number;
}

export interface MatchResultRow {
  id: string;
  club_id: string;
  opponent_club_id: string | null;
  winner_club_id: string | null;
  opponent_name: string | null;
  match_date: string;
  branch: Branch;
  match_type: MatchType;
  sets_won: number;
  sets_lost: number;
  set_scores: string | null;
  location: string | null;
  notes: string | null;
  proof_photo_url: string | null;
  elo_before: number;
  elo_after: number;
  elo_delta: number;
  team_a_code_hash: string | null;
  team_b_code_hash: string | null;
  team_a_result_confirmed_at: string | null;
  team_b_result_confirmed_at: string | null;
  ranking_validated_at: string | null;
  ranking_status: 'pendiente' | 'confirmado';
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

export interface BannedClubRow {
  id: string;
  club_name: string;
  club_name_key: string;
  reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminManualMatchRow {
  id: string;
  post_a_id: string | null;
  post_b_id: string | null;
  post_a_club_name: string;
  post_b_club_name: string;
  branch: string | null;
  age_category: string | null;
  status: 'active' | 'archived' | 'cancelled';
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
