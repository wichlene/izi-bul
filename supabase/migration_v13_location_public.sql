-- Herkes online kullanıcıların konumunu görebilir
-- (live_locations tablosunda zaten sadece aktif oturumlar var)
drop policy if exists "ll read" on live_locations;
create policy "ll read" on live_locations for select using (true);
