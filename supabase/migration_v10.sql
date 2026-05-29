-- v10: post beğenileri

create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table post_likes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='post_likes' and policyname='post_likes read') then
    create policy "post_likes read" on post_likes for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='post_likes' and policyname='post_likes own write') then
    create policy "post_likes own write" on post_likes for insert with check (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='post_likes' and policyname='post_likes own delete') then
    create policy "post_likes own delete" on post_likes for delete using (auth.uid() = user_id);
  end if;
end $$;
