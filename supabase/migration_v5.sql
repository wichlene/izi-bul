-- =============================================
-- Migration v5: Fix RLS policies (INSERT needs WITH CHECK)
-- =============================================

-- Drop old broken policies and recreate with proper INSERT support
drop policy if exists "friend_requests own" on friend_requests;
drop policy if exists "friendships own" on friendships;
drop policy if exists "messages own" on messages;
drop policy if exists "posts own write" on posts;
drop policy if exists "progress own" on user_quest_progress;

-- friend_requests: kullanıcı kendi gönderdiği/aldığı istekleri görebilir; sadece kendi adına istek gönderebilir; alıcı veya gönderen güncelleyebilir
create policy "friend_requests select" on friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "friend_requests insert" on friend_requests for insert
  with check (auth.uid() = from_user_id);
create policy "friend_requests update" on friend_requests for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id)
  with check (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "friend_requests delete" on friend_requests for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- friendships: kullanıcı kendi arkadaşlıklarını görebilir; insert sırasında user_id kendisi olmalı
create policy "friendships select" on friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friendships insert" on friendships for insert
  with check (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friendships delete" on friendships for delete
  using (auth.uid() = user_id);

-- messages
create policy "messages select" on messages for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "messages insert" on messages for insert
  with check (auth.uid() = from_user_id);
create policy "messages update" on messages for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

-- posts
create policy "posts insert" on posts for insert
  with check (auth.uid() = user_id);
create policy "posts delete" on posts for delete
  using (auth.uid() = user_id);

-- user_quest_progress
create policy "progress select" on user_quest_progress for select
  using (auth.uid() = user_id);
create policy "progress insert" on user_quest_progress for insert
  with check (auth.uid() = user_id);
create policy "progress update" on user_quest_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profiles tablosunda username search için public select yetkisi (zaten var olabilir)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles public read') then
    create policy "profiles public read" on profiles for select using (true);
  end if;
end $$;

-- Live locations için public read (haritadan görmek için)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'live_locations' and policyname = 'live_locations public read') then
    create policy "live_locations public read" on live_locations for select using (true);
  end if;
end $$;
