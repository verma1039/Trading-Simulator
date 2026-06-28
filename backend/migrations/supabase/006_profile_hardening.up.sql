alter table public.profiles
  add column if not exists timezone text default 'Asia/Kolkata',
  add column if not exists country text default 'India',
  add column if not exists last_login_at timestamptz;

update public.profiles
set timezone = 'Asia/Kolkata'
where timezone is null or btrim(timezone) = '';

update public.profiles
set country = 'India'
where country is null or btrim(country) = '';

alter table public.profiles
  alter column timezone set default 'Asia/Kolkata',
  alter column country set default 'India';

update public.profiles
set phone_number = null
where phone_number is not null
  and btrim(phone_number) = '';

with ranked_phone_numbers as (
  select
    user_id,
    row_number() over (
      partition by phone_number
      order by created_at asc, user_id asc
    ) as phone_rank
  from public.profiles
  where phone_number is not null
    and btrim(phone_number) <> ''
)
update public.profiles p
set phone_number = null,
    profile_completed = false
from ranked_phone_numbers r
where p.user_id = r.user_id
  and r.phone_rank > 1;

create unique index if not exists profiles_phone_number_unique
on public.profiles(phone_number)
where phone_number is not null;

create index if not exists idx_profiles_last_login_at
on public.profiles(last_login_at);
