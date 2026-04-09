export type Branch = 'femenina' | 'masculina' | 'mixta';
export type Level = 'principiante' | 'intermedio' | 'avanzado';

export interface PostRow {
  id: string;
  club_name: string;
  contact_email: string;
  instagram: string;
  address: string;
  comuna: string;
  city: string;
  play_date: string | null;
  weekday: string | null;
  start_time: string;
  end_time: string;
  branch: Branch;
  level: Level;
  has_court: boolean;
  notes: string | null;
  status: 'open' | 'closed';
  created_at: string;
}

export interface MatchRow {
  id: string;
  post_a_id: string;
  post_b_id: string;
  compatibility_score: number;
  status: 'active' | 'archived';
  created_at: string;
}

export interface MatchCard {
  matchId: string;
  score: number;
  a: PostRow;
  b: PostRow;
}
