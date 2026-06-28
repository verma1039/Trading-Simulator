alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists date_of_birth date,
  add column if not exists profile_completed boolean not null default false;

update public.profiles
set profile_completed = false
where profile_completed is null;

alter table public.profiles
  alter column profile_completed set default false,
  alter column profile_completed set not null;

create index if not exists idx_profiles_profile_completed on public.profiles(profile_completed);
create index if not exists idx_profiles_role_profile_completed on public.profiles(role, profile_completed);
