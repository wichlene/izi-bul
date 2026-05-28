-- Profiles tablosuna eklemeler
alter table profiles add column if not exists is_admin boolean default false;
alter table profiles add column if not exists location_visible boolean default true;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists total_cash_earned integer default 0;
alter table profiles add column if not exists is_premium boolean default false;
alter table profiles add column if not exists premium_until timestamp with time zone;
alter table profiles add column if not exists notification_enabled boolean default true;

-- Admin kullanıcısını set et (kendi email'in)
update profiles set is_admin = true
where id = (select id from auth.users where email = 'emrckc52@gmail.com');

-- Canlı konum tablosu (Supabase Realtime ile)
create table if not exists live_locations (
  user_id uuid primary key references profiles(id) on delete cascade,
  quest_id uuid references quests(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamp with time zone default now()
);

alter table live_locations enable row level security;
create policy "Public read live_locations" on live_locations for select using (
  exists (select 1 from profiles where id = user_id and location_visible = true)
);
create policy "Own live_location insert" on live_locations for insert with check (auth.uid() = user_id);
create policy "Own live_location update" on live_locations for update using (auth.uid() = user_id);
create policy "Own live_location delete" on live_locations for delete using (auth.uid() = user_id);

-- İşletme paketleri
create table if not exists business_packages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  business_name text not null,
  contact_email text not null,
  package_type text not null default 'basic', -- basic | featured | premium
  quest_id uuid references quests(id),
  amount_paid integer not null default 0,
  status text not null default 'pending', -- pending | active | completed
  expires_at timestamp with time zone
);

alter table business_packages enable row level security;
create policy "Admin read packages" on business_packages for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Anyone insert package" on business_packages for insert with check (true);

-- Quests tablosuna featured ekle
alter table quests add column if not exists is_featured boolean default false;
alter table quests add column if not exists view_count integer default 0;

-- Realtime için live_locations'ı enable et
alter publication supabase_realtime add table live_locations;
