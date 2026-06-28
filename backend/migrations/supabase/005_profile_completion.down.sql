drop index if exists public.idx_profiles_role_profile_completed;
drop index if exists public.idx_profiles_profile_completed;

alter table public.profiles
  drop column if exists profile_completed,
  drop column if exists date_of_birth,
  drop column if exists phone_number;
