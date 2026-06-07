export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  city?: string;
  total_points: number;
  total_finds: number;
  level: number;
  is_admin?: boolean;
  is_business?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  hint?: string;
  region?: string;
  latitude: number;
  longitude: number;
  difficulty: string;
  points: number;
  cash_reward: number;
  max_distance_meters: number;
  requires_photo_proof: boolean;
  is_active: boolean;
  is_featured?: boolean;
  total_solved: number;
}
