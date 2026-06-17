drop policy if exists admin_actions_select_related on public.admin_actions;

create policy "admin_actions_select_related"
on public.admin_actions for select
using (
  auth.uid() = user_id
  or auth.uid() = admin_user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);

drop index if exists public.ix_admin_actions_target_user_id_created_at;

alter table public.admin_actions
drop column if exists target_user_id;

alter table public.profiles
drop constraint if exists ck_profiles_status;

alter table public.profiles
drop column if exists status;
