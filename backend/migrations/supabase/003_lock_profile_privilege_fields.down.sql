drop trigger if exists trg_profiles_prevent_privilege_escalation on public.profiles;
drop function if exists public.prevent_profile_privilege_escalation();

revoke insert (user_id, display_name) on public.profiles from authenticated;
revoke update (display_name) on public.profiles from authenticated;
grant insert, update on public.profiles to authenticated;
