-- Adds admin account status and explicit target_user_id audit fields.

alter table public.profiles
add column if not exists status varchar(32) not null default 'ACTIVE';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ck_profiles_status'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint ck_profiles_status
    check (status in ('ACTIVE', 'SUSPENDED', 'BANNED'));
  end if;
end;
$$;

alter table public.admin_actions
add column if not exists target_user_id uuid references auth.users(id) on delete cascade;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_actions'
      and column_name = 'user_id'
  ) then
    update public.admin_actions
    set target_user_id = user_id
    where target_user_id is null;
  end if;
end;
$$;

create index if not exists ix_admin_actions_target_user_id_created_at
  on public.admin_actions(target_user_id, created_at);

drop policy if exists admin_actions_select_related on public.admin_actions;
create policy "admin_actions_select_related"
on public.admin_actions for select
using (
  auth.uid() = target_user_id
  or auth.uid() = admin_user_id
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);
