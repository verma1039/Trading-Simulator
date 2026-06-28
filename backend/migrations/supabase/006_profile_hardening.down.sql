drop index if exists public.idx_profiles_last_login_at;
drop index if exists public.profiles_phone_number_unique;

alter table public.profiles
  drop column if exists last_login_at,
  drop column if exists country,
  drop column if exists timezone;
