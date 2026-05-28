export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'auto_won';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  city?: string;
  total_points: number;
  total_finds: number;
  level: number;
  created_at: string;
  is_admin?: boolean;
  is_premium?: boolean;
  location_visible?: boolean;
}

export interface Quest {
  id: string;
  created_at: string;
  category_id: string;
  title: string;
  description: string;
  photo_url: string;
  hint?: string;
  region?: string;
  latitude: number;
  longitude: number;
  difficulty: Difficulty;
  points: number;
  cash_reward: number;
  max_distance_meters: number;
  requires_photo_proof: boolean;
  is_active: boolean;
  is_featured?: boolean;
  total_attempts: number;
  total_solved: number;
  created_by?: string;
  expires_at?: string;
  category?: Category;
}

export interface Submission {
  id: string;
  created_at: string;
  quest_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  photo_url?: string;
  status: SubmissionStatus;
  is_winner: boolean;
  points_earned: number;
  reviewed_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const DIFFICULTIES: Record<Difficulty, { label: string; points: number; color: string }> = {
  easy:      { label: 'Kolay',   points: 50,   color: '#22c55e' },
  medium:    { label: 'Orta',    points: 100,  color: '#f97316' },
  hard:      { label: 'Zor',     points: 250,  color: '#ef4444' },
  legendary: { label: 'Efsane',  points: 1000, color: '#a855f7' },
};
