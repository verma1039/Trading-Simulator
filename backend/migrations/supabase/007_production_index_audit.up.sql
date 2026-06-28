-- Production index audit cleanup.
-- Removes redundant indexes while preserving unique constraints and active query paths.

drop index if exists public.profiles_email_key;
drop index if exists public.idx_profiles_user_id;
drop index if exists public.idx_wallets_user_id;
drop index if exists public.holdings_user_id_symbol_key;
drop index if exists public.idx_holdings_user_id;
drop index if exists public.ix_holdings_user_id_symbol;
drop index if exists public.ix_orders_user_id_created_at;

create index if not exists idx_admin_actions_target_user_created_at
on public.admin_actions(target_user_id, created_at desc);

create index if not exists idx_admin_actions_admin_user_created_at
on public.admin_actions(admin_user_id, created_at desc);

drop index if exists public.idx_admin_actions_target_user_id;
drop index if exists public.ix_admin_actions_user_id_created_at;
drop index if exists public.ix_admin_actions_admin_user_id_created_at;
