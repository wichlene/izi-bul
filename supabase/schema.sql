-- ============================================================
-- İzi Bul - Türkiye Keşif Oyunu - Veritabanı Şeması v2
-- ============================================================

-- KATEGORİLER
create table if not exists categories (
  id text primary key,            -- 'bridge', 'mosque', 'statue', vb.
  name text not null,             -- "Köprü", "Cami", "Heykel"
  icon text not null,             -- emoji veya icon name
  color text default '#f97316'
);

insert into categories (id, name, icon, color) values
  ('bridge',   'Köprü',           '🌉', '#3b82f6'),
  ('mosque',   'Cami',            '🕌', '#10b981'),
  ('statue',   'Heykel',          '🗿', '#a855f7'),
  ('museum',   'Müze',            '🏛️', '#eab308'),
  ('cafe',     'Kafe',            '☕', '#f97316'),
  ('nature',   'Doğa',            '🌲', '#22c55e'),
  ('historic', 'Tarihi Yapı',     '🏰', '#ef4444'),
  ('street',   'Sokak/Mahalle',   '🛣️', '#6366f1'),
  ('hidden',   'Gizli Nokta',     '🗝️', '#ec4899')
on conflict (id) do nothing;

-- KULLANICI PROFİLLERİ (Supabase Auth ile bağlı)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  city text,
  total_points integer default 0,
  total_finds integer default 0,
  level integer default 1,
  created_at timestamp with time zone default now()
);

-- GÖREVLER (Quests)
create table if not exists quests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  category_id text references categories(id) not null,
  title text not null,                       -- "Bu köprü nerede?"
  description text not null,
  photo_url text not null,                   -- gizemli fotoğraf
  hint text,                                 -- ipucu metni
  region text,                               -- "İstanbul / Anadolu"
  latitude double precision not null,        -- gizli konum
  longitude double precision not null,
  difficulty text not null default 'medium', -- easy | medium | hard | legendary
  points integer not null default 100,
  cash_reward integer default 0,             -- ekstra nakit (TL)
  max_distance_meters integer default 50,
  requires_photo_proof boolean default true,
  is_active boolean default true,
  total_attempts integer default 0,
  total_solved integer default 0,
  created_by uuid references profiles(id),
  expires_at timestamp with time zone
);

-- ÇÖZÜM DENEMELERİ (Submissions)
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  quest_id uuid references quests(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  latitude double precision not null,
  longitude double precision not null,
  distance_meters integer not null,
  photo_url text,                            -- kullanıcının kanıt fotoğrafı
  status text not null default 'pending',    -- pending | approved | rejected | auto_won
  is_winner boolean default false,
  points_earned integer default 0,
  reviewed_at timestamp with time zone,
  unique(quest_id, user_id, is_winner)       -- bir kullanıcı bir görevi 1 kere kazanabilir
);

-- ÖDÜLLER (Para çekimleri için)
create table if not exists rewards (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references profiles(id) on delete cascade not null,
  quest_id uuid references quests(id),
  amount_tl integer not null,
  status text not null default 'pending',    -- pending | paid | cancelled
  payment_method text,                       -- 'iban' vb.
  payment_details jsonb,
  paid_at timestamp with time zone
);

-- ROZETLER
create table if not exists badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  requirement_type text not null,            -- 'finds_count' | 'category_count' | 'first_solver' | 'city_master'
  requirement_value integer
);

insert into badges (id, name, description, icon, requirement_type, requirement_value) values
  ('first_find',  'İlk Keşif',       'İlk görevini tamamladın!',       '🎯', 'finds_count', 1),
  ('explorer',    'Kâşif',           '10 görev tamamladın',             '🧭', 'finds_count', 10),
  ('legend',      'Efsane',          '100 görev tamamladın',            '👑', 'finds_count', 100),
  ('bridge_5',    'Köprü Avcısı',    '5 köprü buldun',                  '🌉', 'category_count', 5),
  ('mosque_5',    'Cami Bilirkişi',  '5 cami buldun',                   '🕌', 'category_count', 5),
  ('first_solver','İlk Bulan',       'Bir görevi ilk sen çözdün',       '🥇', 'first_solver', 1)
on conflict (id) do nothing;

-- KULLANICI-ROZET İLİŞKİSİ
create table if not exists user_badges (
  user_id uuid references profiles(id) on delete cascade,
  badge_id text references badges(id) on delete cascade,
  earned_at timestamp with time zone default now(),
  primary key (user_id, badge_id)
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table profiles      enable row level security;
alter table quests        enable row level security;
alter table submissions   enable row level security;
alter table rewards       enable row level security;
alter table user_badges   enable row level security;
alter table categories    enable row level security;
alter table badges        enable row level security;

-- Categories & Badges: herkes okuyabilir
create policy "Public read categories" on categories for select using (true);
create policy "Public read badges"     on badges     for select using (true);

-- Profiles: herkes okur, sadece kendin güncelleyebilirsin
create policy "Public read profiles"   on profiles for select using (true);
create policy "Insert own profile"     on profiles for insert with check (auth.uid() = id);
create policy "Update own profile"     on profiles for update using (auth.uid() = id);

-- Quests: herkes okur, giriş yapanlar oluşturabilir
create policy "Public read quests"     on quests for select using (true);
create policy "Auth users create quest" on quests for insert with check (auth.uid() is not null);
create policy "Owner updates quest"    on quests for update using (auth.uid() = created_by);

-- Submissions: herkes okur, giriş yapanlar gönderir
create policy "Public read submissions" on submissions for select using (true);
create policy "Auth users submit"       on submissions for insert with check (auth.uid() = user_id);

-- Rewards: sadece kendi ödüllerini görebilirsin
create policy "Own rewards"            on rewards for select using (auth.uid() = user_id);

-- User badges
create policy "Public read user_badges" on user_badges for select using (true);

-- ============================================================
-- INDEKSLER
-- ============================================================
create index if not exists quests_active_idx on quests(is_active);
create index if not exists quests_category_idx on quests(category_id);
create index if not exists quests_difficulty_idx on quests(difficulty);
create index if not exists submissions_quest_idx on submissions(quest_id);
create index if not exists submissions_user_idx on submissions(user_id);
create index if not exists profiles_points_idx on profiles(total_points desc);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'kullanici_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
