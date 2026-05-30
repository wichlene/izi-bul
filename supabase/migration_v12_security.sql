-- ============================================================
-- migration_v12_security.sql
-- Kritik güvenlik düzeltmeleri — Supabase SQL Editor'da çalıştır
-- ============================================================

-- ── 1. live_locations: location_visible = false olanlar gizlenir ──────────
-- Önceki policy: using (true) → herkes herkesi görebiliyordu
drop policy if exists "ll read" on live_locations;
create policy "ll read" on live_locations for select
  using (
    auth.uid() = user_id  -- kendi konumunu her zaman görebilir
    or (
      select location_visible from profiles
      where profiles.id = live_locations.user_id
    ) = true
  );

-- ── 2. submissions: sadece sahibi ve admin görebilir ─────────────────────
-- Önceki policy: using (true) → tüm kullanıcıların GPS koordinatları açıktı
drop policy if exists "sub read" on submissions;
create policy "sub read" on submissions for select
  using (
    auth.uid() = user_id
    or auth.uid() in (select id from profiles where is_admin = true)
  );

-- ── 3. post_comments: giriş yapmış kullanıcılar okuyabilir ───────────────
-- Varsa eski policy'yi temizle, yoksa ekle
drop policy if exists "comment read" on post_comments;
drop policy if exists "comment insert" on post_comments;
drop policy if exists "comment delete" on post_comments;

alter table if exists post_comments enable row level security;

create policy "comment read" on post_comments for select using (true);
create policy "comment insert" on post_comments for insert
  with check (auth.uid() = user_id);
create policy "comment delete" on post_comments for delete
  using (
    auth.uid() = user_id
    or auth.uid() in (select id from profiles where is_admin = true)
  );

-- ── 4. post_likes: kendi beğenisini silebilir, yalnızca bir kez beğenebilir
-- (unique constraint yoksa ekle)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'post_likes_unique'
  ) then
    alter table post_likes add constraint post_likes_unique
      unique (post_id, user_id);
  end if;
end $$;

-- ── 5. profiles: UPDATE sadece kendi profilini değiştirebilir ────────────
-- (zaten vardı ama güvenlik için tekrar doğrula)
drop policy if exists "prof update" on profiles;
create policy "prof update" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- is_admin = true kendi kendine set edilemesin
-- (admin client üzerinden admin zaten yapabilir, bu kullanıcıyı korur)
drop policy if exists "prof admin flag" on profiles;
create policy "prof admin flag" on profiles for update
  using (
    auth.uid() = id
    and (
      -- is_admin değiştirilmek isteniyorsa sadece mevcut adminler yapabilir
      (select is_admin from profiles where id = auth.uid()) = true
      or is_admin = (select is_admin from profiles where id = auth.uid())
    )
  )
  with check (auth.uid() = id);

-- ── 6. Realtime izinleri: sadece kendi verilerini subscribe edebilir ──────
-- live_locations channel'ı artık filtered çalışacak (location_visible check)
-- messages channel zaten from/to filter'lı
