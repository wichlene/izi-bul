-- profiles tablosuna telefon kolonu ekle
alter table profiles add column if not exists phone text;

-- Kayıt sırasında telefonu da profile aktar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'kullanici_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end; $$;
