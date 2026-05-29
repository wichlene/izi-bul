-- v9: notifications tablosu + messages son mesaj takibi

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'info',
  -- 'quest_complete' | 'good_deed' | 'friend_request' | 'message' | 'friend_accept'
  title text not null,
  body text,
  actor_id uuid references profiles(id) on delete set null,
  actor_username text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications own read') then
    create policy "notifications own read" on notifications for select using (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications own update') then
    create policy "notifications own update" on notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
