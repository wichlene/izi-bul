-- ============================================================
-- İZİ BUL — TAM KURULUM (idempotent)
-- Bu dosyayı Supabase SQL Editor'da bir kez çalıştır.
-- Tekrar çalıştırmak güvenli — her şey "if not exists" / drop+create.
-- Tüm tabloları, sütunları, RLS politikalarını, realtime'ı garanti eder.
-- ============================================================

-- ---------- TABLOLAR ----------
create table if not exists categories (
  id text primary key, name text not null, icon text not null, color text default '#f97316'
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null, full_name text, avatar_url text, city text,
  total_points integer default 0, total_finds integer default 0, level integer default 1,
  created_at timestamptz default now()
);

create table if not exists quests (
  id uuid default gen_random_uuid() primary key, created_at timestamptz default now(),
  category_id text references categories(id) not null,
  title text not null, description text not null, photo_url text not null, hint text, region text,
  latitude double precision not null, longitude double precision not null,
  difficulty text not null default 'medium', points integer not null default 100,
  cash_reward integer default 0, max_distance_meters integer default 50,
  requires_photo_proof boolean default true, is_active boolean default true,
  total_attempts integer default 0, total_solved integer default 0,
  created_by uuid references profiles(id), expires_at timestamptz
);

create table if not exists submissions (
  id uuid default gen_random_uuid() primary key, created_at timestamptz default now(),
  quest_id uuid references quests(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  latitude double precision not null, longitude double precision not null,
  distance_meters integer not null, photo_url text,
  status text not null default 'pending', is_winner boolean default false,
  points_earned integer default 0, reviewed_at timestamptz
);

create table if not exists rewards (
  id uuid default gen_random_uuid() primary key, created_at timestamptz default now(),
  user_id uuid references profiles(id) on delete cascade not null,
  quest_id uuid references quests(id), amount_tl integer not null,
  status text not null default 'pending', payment_method text, payment_details jsonb, paid_at timestamptz
);

create table if not exists quest_steps (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  step_number int not null, step_type text not null default 'question',
  question text, correct_answer text,
  target_lat double precision not null, target_lng double precision not null,
  approach_radius_meters int not null default 500, hint text, photo_url text,
  created_at timestamptz default now(), unique(quest_id, step_number)
);

create table if not exists user_quest_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  current_step int not null default 1, is_completed boolean not null default false,
  completed_at timestamptz, started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(), unique(user_id, quest_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quest_id uuid references quests(id) on delete set null,
  post_type text not null default 'quest_complete',
  content text, photo_url text,
  latitude double precision, longitude double precision,
  created_at timestamptz default now()
);

create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(), unique(post_id, user_id)
);

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references profiles(id) on delete cascade,
  to_user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending', created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  friend_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(), unique(user_id, friend_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references profiles(id) on delete cascade,
  to_user_id uuid not null references profiles(id) on delete cascade,
  content text not null, is_read boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'info', title text not null, body text,
  actor_id uuid references profiles(id) on delete set null, actor_username text,
  link text, is_read boolean not null default false, created_at timestamptz default now()
);

create table if not exists live_locations (
  user_id uuid primary key references profiles(id) on delete cascade,
  latitude double precision not null, longitude double precision not null,
  updated_at timestamptz default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text, phone text, business_name text,
  message text not null, type text not null default 'general',
  status text not null default 'new', created_at timestamptz default now()
);

-- ---------- PROFİL EK SÜTUNLARI ----------
alter table profiles add column if not exists is_admin boolean default false;
alter table profiles add column if not exists location_visible boolean default true;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists total_cash_earned integer default 0;
alter table profiles add column if not exists total_wins int default 0;
alter table profiles add column if not exists is_premium boolean default false;
alter table profiles add column if not exists premium_until timestamptz;
alter table profiles add column if not exists notification_enabled boolean default true;
alter table profiles add column if not exists is_business boolean default false;
alter table profiles add column if not exists business_name text;
alter table profiles add column if not exists business_phone text;
alter table profiles add column if not exists business_address text;
alter table quests add column if not exists is_multistep boolean default false;
alter table posts add column if not exists latitude double precision;
alter table posts add column if not exists longitude double precision;

-- ---------- RLS AÇ ----------
alter table profiles enable row level security;
alter table quests enable row level security;
alter table submissions enable row level security;
alter table rewards enable row level security;
alter table categories enable row level security;
alter table quest_steps enable row level security;
alter table user_quest_progress enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table friend_requests enable row level security;
alter table friendships enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table live_locations enable row level security;
alter table contact_messages enable row level security;

-- ---------- POLİTİKALAR (drop + create — temiz) ----------
-- categories
drop policy if exists "cat read" on categories;
create policy "cat read" on categories for select using (true);

-- profiles
drop policy if exists "prof read" on profiles;
drop policy if exists "prof insert" on profiles;
drop policy if exists "prof update" on profiles;
create policy "prof read" on profiles for select using (true);
create policy "prof insert" on profiles for insert with check (auth.uid() = id);
create policy "prof update" on profiles for update using (auth.uid() = id);

-- quests
drop policy if exists "quest read" on quests;
drop policy if exists "quest insert" on quests;
drop policy if exists "quest update" on quests;
create policy "quest read" on quests for select using (true);
create policy "quest insert" on quests for insert with check (auth.uid() is not null);
create policy "quest update" on quests for update using (auth.uid() = created_by or auth.uid() in (select id from profiles where is_admin = true));

-- submissions
drop policy if exists "sub read" on submissions;
drop policy if exists "sub insert" on submissions;
create policy "sub read" on submissions for select using (true);
create policy "sub insert" on submissions for insert with check (auth.uid() = user_id);

-- rewards
drop policy if exists "rew own" on rewards;
create policy "rew own" on rewards for select using (auth.uid() = user_id);

-- quest_steps
drop policy if exists "qs read" on quest_steps;
drop policy if exists "qs admin" on quest_steps;
create policy "qs read" on quest_steps for select using (true);
create policy "qs admin" on quest_steps for all using (auth.uid() in (select id from profiles where is_admin = true));

-- user_quest_progress
drop policy if exists "uqp own" on user_quest_progress;
create policy "uqp own" on user_quest_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- posts
drop policy if exists "post read" on posts;
drop policy if exists "post insert" on posts;
drop policy if exists "post delete" on posts;
drop policy if exists "post admin delete" on posts;
create policy "post read" on posts for select using (true);
create policy "post insert" on posts for insert with check (auth.uid() = user_id);
create policy "post delete" on posts for delete using (auth.uid() = user_id);
create policy "post admin delete" on posts for delete using (auth.uid() in (select id from profiles where is_admin = true));

-- post_likes
drop policy if exists "like read" on post_likes;
drop policy if exists "like insert" on post_likes;
drop policy if exists "like delete" on post_likes;
create policy "like read" on post_likes for select using (true);
create policy "like insert" on post_likes for insert with check (auth.uid() = user_id);
create policy "like delete" on post_likes for delete using (auth.uid() = user_id);

-- friend_requests
drop policy if exists "fr select" on friend_requests;
drop policy if exists "fr insert" on friend_requests;
drop policy if exists "fr update" on friend_requests;
drop policy if exists "fr delete" on friend_requests;
create policy "fr select" on friend_requests for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "fr insert" on friend_requests for insert with check (auth.uid() = from_user_id);
create policy "fr update" on friend_requests for update using (auth.uid() = from_user_id or auth.uid() = to_user_id) with check (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "fr delete" on friend_requests for delete using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- friendships
drop policy if exists "fs select" on friendships;
drop policy if exists "fs insert" on friendships;
drop policy if exists "fs delete" on friendships;
create policy "fs select" on friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "fs insert" on friendships for insert with check (auth.uid() = user_id or auth.uid() = friend_id);
create policy "fs delete" on friendships for delete using (auth.uid() = user_id);

-- messages
drop policy if exists "msg select" on messages;
drop policy if exists "msg insert" on messages;
drop policy if exists "msg update" on messages;
create policy "msg select" on messages for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "msg insert" on messages for insert with check (auth.uid() = from_user_id);
create policy "msg update" on messages for update using (auth.uid() = to_user_id) with check (auth.uid() = to_user_id);

-- notifications
drop policy if exists "notif read" on notifications;
drop policy if exists "notif update" on notifications;
create policy "notif read" on notifications for select using (auth.uid() = user_id);
create policy "notif update" on notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- live_locations
drop policy if exists "ll read" on live_locations;
drop policy if exists "ll insert" on live_locations;
drop policy if exists "ll update" on live_locations;
drop policy if exists "ll delete" on live_locations;
create policy "ll read" on live_locations for select using (true);
create policy "ll insert" on live_locations for insert with check (auth.uid() = user_id);
create policy "ll update" on live_locations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ll delete" on live_locations for delete using (auth.uid() = user_id);

-- contact_messages
drop policy if exists "contact insert" on contact_messages;
drop policy if exists "contact admin read" on contact_messages;
drop policy if exists "contact admin update" on contact_messages;
create policy "contact insert" on contact_messages for insert with check (true);
create policy "contact admin read" on contact_messages for select using (auth.uid() in (select id from profiles where is_admin = true));
create policy "contact admin update" on contact_messages for update using (auth.uid() in (select id from profiles where is_admin = true));

-- ---------- REALTIME (anlık mesaj + bildirim) ----------
do $$ begin
  begin alter publication supabase_realtime add table messages; exception when others then null; end;
  begin alter publication supabase_realtime add table notifications; exception when others then null; end;
  begin alter publication supabase_realtime add table live_locations; exception when others then null; end;
end $$;

-- ---------- KATEGORİLER (seed) ----------
insert into categories (id, name, icon, color) values
  ('bridge','Köprü','🌉','#3b82f6'), ('mosque','Cami','🕌','#10b981'),
  ('statue','Heykel','🗿','#a855f7'), ('museum','Müze','🏛️','#eab308'),
  ('cafe','Kafe','☕','#f97316'), ('nature','Doğa','🌲','#22c55e'),
  ('historic','Tarihi Yapı','🏰','#ef4444'), ('street','Sokak/Mahalle','🛣️','#6366f1'),
  ('hidden','Gizli Nokta','🗝️','#ec4899')
on conflict (id) do nothing;

-- ---------- YENİ KULLANICI → PROFİL TETİKLEYİCİSİ ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'username', 'kullanici_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- İNDEKSLER ----------
create index if not exists quests_active_idx on quests(is_active);
create index if not exists posts_created_idx on posts(created_at desc);
create index if not exists messages_to_idx on messages(to_user_id, is_read);
create index if not exists notifications_user_idx on notifications(user_id, is_read);
create index if not exists post_likes_post_idx on post_likes(post_id);
