-- Puan mağazası satın alımları
create table if not exists store_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  item_id text not null,
  item_title text not null,
  points_spent integer not null,
  redemption_code text not null unique,
  status text default 'active' check (status in ('active', 'used', 'expired')),
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz default now()
);

alter table store_purchases enable row level security;

create policy "Users can view own purchases"
  on store_purchases for select
  using (auth.uid() = user_id);

create policy "Service role can insert"
  on store_purchases for insert
  with check (true);
