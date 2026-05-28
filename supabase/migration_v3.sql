-- İşletme rolü ekle
alter table profiles add column if not exists is_business boolean default false;

-- İşletme adı ve bilgileri
alter table profiles add column if not exists business_name text;
alter table profiles add column if not exists business_phone text;
alter table profiles add column if not exists business_address text;
