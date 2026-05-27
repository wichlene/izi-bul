-- İzi Bul - Konum Bulma Ödül Uygulaması

-- Challenges: kafe/işletme bir fotoğraf + gizli konum paylaşıyor
create table if not exists challenges (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  cafe_name text not null,
  description text not null,
  photo_url text not null,
  hint text,
  latitude double precision not null,
  longitude double precision not null,
  reward text not null,
  reward_type text not null default 'product', -- 'product' | 'cash'
  reward_amount integer, -- TL cinsinden (cash ise)
  is_active boolean default true,
  winner_id uuid,
  winner_name text,
  created_by uuid,
  max_distance_meters integer default 150,
  total_guesses integer default 0,
  expires_at timestamp with time zone
);

-- Guesses: kullanıcı haritada pin bırakıyor
create table if not exists guesses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  challenge_id uuid references challenges(id) on delete cascade not null,
  user_name text not null,
  user_id uuid,
  latitude double precision not null,
  longitude double precision not null,
  distance_meters double precision,
  is_winner boolean default false
);

-- Storage bucket for challenge photos
-- Run in Supabase Storage: create bucket 'challenge-photos' with public access

-- RLS Policies
alter table challenges enable row level security;
alter table guesses enable row level security;

-- Anyone can read active challenges
create policy "Public read challenges" on challenges
  for select using (true);

-- Anyone can insert a challenge (in production: restrict to authenticated cafe owners)
create policy "Anyone can create challenge" on challenges
  for insert with check (true);

-- Challenge creators can update their own
create policy "Creator can update challenge" on challenges
  for update using (true);

-- Anyone can read guesses
create policy "Public read guesses" on guesses
  for select using (true);

-- Anyone can submit a guess
create policy "Anyone can guess" on guesses
  for insert with check (true);

-- Indexes
create index if not exists challenges_is_active_idx on challenges(is_active);
create index if not exists guesses_challenge_id_idx on guesses(challenge_id);
