-- Prevent browser/authenticated clients from changing authorization fields.
-- Safe user-owned profile updates are limited to display_name. Role/status
-- changes must happen through trusted backend database access or service role.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      if new.role is distinct from 'user'
        or new.status is distinct from 'ACTIVE'
      then
        raise exception 'Profile role and status are managed by administrators'
          using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.role is distinct from old.role
        or new.status is distinct from old.status
      then
        raise exception 'Profile role and status are managed by administrators'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_prevent_privilege_escalation on public.profiles;
create trigger trg_profiles_prevent_privilege_escalation
before insert or update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

revoke insert, update on public.profiles from anon, authenticated;
grant insert (user_id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
