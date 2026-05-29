-- v8: Sosyal paylaşım (iyilik hareketi), duyurular, admin iletişim paneli, çok adımlı görev

-- Posts: iyilik hareketi için konum + tür genişletmesi
alter table posts add column if not exists latitude double precision;
alter table posts add column if not exists longitude double precision;
-- post_type artık: quest_complete | announcement | social | good_deed

-- Kullanıcılar kendi postlarını oluşturabilsin
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'posts' and policyname = 'Users insert own posts') then
    create policy "Users insert own posts" on posts
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- Admin iletişim / yatırımcı talepleri tablosu
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  business_name text,
  message text not null,
  type text not null default 'general',  -- general | business | investor
  status text not null default 'new',    -- new | read | replied | closed
  created_at timestamptz default now()
);

alter table contact_messages enable row level security;

-- Herkes mesaj gönderebilir (iletişim formu)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'contact_messages' and policyname = 'Anyone can send contact') then
    create policy "Anyone can send contact" on contact_messages
      for insert with check (true);
  end if;
end $$;

-- Sadece adminler okuyabilir / güncelleyebilir
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'contact_messages' and policyname = 'Admins read contact') then
    create policy "Admins read contact" on contact_messages
      for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'contact_messages' and policyname = 'Admins update contact') then
    create policy "Admins update contact" on contact_messages
      for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
  end if;
end $$;
