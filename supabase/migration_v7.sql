-- Nuke all live_locations policies and start clean
do $$ declare
  r record;
begin
  for r in select policyname from pg_policies where tablename = 'live_locations' loop
    execute 'drop policy if exists "' || r.policyname || '" on live_locations';
  end loop;
end $$;

-- Everyone can read (Snapchat map style)
create policy "live_locations_select" on live_locations
  for select using (true);

-- Authenticated users can insert their own row
create policy "live_locations_insert" on live_locations
  for insert with check (auth.uid() = user_id);

-- Can update their own row
create policy "live_locations_update" on live_locations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Can delete their own row
create policy "live_locations_delete" on live_locations
  for delete using (auth.uid() = user_id);

-- Also allow posts to be deleted by admins
-- First check if delete policy exists for posts
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'posts' and policyname = 'Admin delete posts'
  ) then
    create policy "Admin delete posts" on posts
      for delete using (
        auth.uid() = user_id
        or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
      );
  end if;
end $$;
