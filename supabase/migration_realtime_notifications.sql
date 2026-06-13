-- Bildirimlerin mobil uygulamaya anlık düşmesi için Realtime publication'ı garanti eder.
-- Supabase Dashboard → SQL Editor'de bir kez çalıştır.

do $$
begin
  begin alter publication supabase_realtime add table messages; exception when others then null; end;
  begin alter publication supabase_realtime add table notifications; exception when others then null; end;
  begin alter publication supabase_realtime add table friend_requests; exception when others then null; end;
  begin alter publication supabase_realtime add table live_locations; exception when others then null; end;
end $$;
