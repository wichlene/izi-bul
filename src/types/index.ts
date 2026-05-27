export interface Challenge {
  id: string;
  created_at: string;
  cafe_name: string;
  description: string;
  photo_url: string;
  hint?: string;
  latitude: number;
  longitude: number;
  reward: string;
  reward_type: 'product' | 'cash';
  reward_amount?: number;
  is_active: boolean;
  winner_id?: string;
  winner_name?: string;
  created_by?: string;
  max_distance_meters: number;
  total_guesses: number;
  expires_at?: string;
}

export interface Guess {
  id: string;
  created_at: string;
  challenge_id: string;
  user_name: string;
  user_id?: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  is_winner: boolean;
}

export interface GuessResult {
  isWinner: boolean;
  distance: number;
  guess: Guess;
}
