-- Fix live_locations: allow all authenticated users to see all live locations (Snapchat map style)
drop policy if exists "Public read live_locations" on live_locations;
drop policy if exists "live_locations public read" on live_locations;

-- Everyone (including unauthenticated) can see all live locations
create policy "live_locations everyone read" on live_locations for select using (true);

-- Fix upsert: also allow INSERT with check
drop policy if exists "Own live_location insert" on live_locations;
create policy "Own live_location insert" on live_locations for insert with check (auth.uid() = user_id);

-- UPDATE policy (already correct)
drop policy if exists "Own live_location update" on live_locations;
create policy "Own live_location update" on live_locations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- DELETE policy
drop policy if exists "Own live_location delete" on live_locations;
create policy "Own live_location delete" on live_locations for delete using (auth.uid() = user_id);
