-- v11: post yorumları

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 280),
  created_at timestamptz default now()
);

alter table post_comments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='post_comments' and policyname='post_comments read') then
    create policy "post_comments read" on post_comments for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='post_comments' and policyname='post_comments insert') then
    create policy "post_comments insert" on post_comments for insert with check (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='post_comments' and policyname='post_comments delete') then
    create policy "post_comments delete" on post_comments for delete using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists post_comments_post_idx on post_comments(post_id, created_at desc);
