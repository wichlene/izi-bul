-- =============================================
-- Migration v4: Multi-step quests, social, friends, chat
-- =============================================

-- Quest steps (çok adımlı görev sistemi)
create table if not exists quest_steps (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  step_number int not null,
  step_type text not null default 'question', -- 'question' | 'location' | 'image' | 'final'
  question text,
  correct_answer text,
  target_lat double precision not null,
  target_lng double precision not null,
  approach_radius_meters int not null default 500,
  hint text,
  photo_url text,
  created_at timestamptz default now(),
  unique(quest_id, step_number)
);

-- Kullanıcı görev ilerlemesi
create table if not exists user_quest_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  current_step int not null default 1,
  is_completed boolean not null default false,
  completed_at timestamptz,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  unique(user_id, quest_id)
);

-- Sosyal akış
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quest_id uuid references quests(id) on delete set null,
  post_type text not null default 'quest_complete', -- 'quest_complete' | 'announcement' | 'social'
  content text,
  photo_url text,
  created_at timestamptz default now()
);

-- Arkadaşlık istekleri
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references profiles(id) on delete cascade,
  to_user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

-- Arkadaşlıklar
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  friend_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Mesajlar
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references profiles(id) on delete cascade,
  to_user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

-- Quests tablosuna is_multistep ekle
alter table quests add column if not exists is_multistep boolean default false;

-- Profiles tablosuna total_wins ekle
alter table profiles add column if not exists total_wins int default 0;

-- RLS policies
alter table quest_steps enable row level security;
alter table user_quest_progress enable row level security;
alter table posts enable row level security;
alter table friend_requests enable row level security;
alter table friendships enable row level security;
alter table messages enable row level security;

create policy "quest_steps public read" on quest_steps for select using (true);
create policy "quest_steps admin write" on quest_steps for all using (auth.uid() in (select id from profiles where is_admin = true));

create policy "progress own" on user_quest_progress for all using (auth.uid() = user_id);

create policy "posts public read" on posts for select using (true);
create policy "posts own write" on posts for insert with check (auth.uid() = user_id);

create policy "friend_requests own" on friend_requests for all using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "friendships own" on friendships for all using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "messages own" on messages for all using (auth.uid() = from_user_id or auth.uid() = to_user_id);
