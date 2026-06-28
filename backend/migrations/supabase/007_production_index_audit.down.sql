-- Recreate indexes removed by 007_production_index_audit.up.sql.
-- This rollback restores the previous redundant index set if needed.

create unique index if not exists profiles_email_key
on public.profiles(email);

create index if not exists idx_profiles_user_id
on public.profiles(user_id);

create index if not exists idx_wallets_user_id
on public.wallets(user_id);

create unique index if not exists holdings_user_id_symbol_key
on public.holdings(user_id, symbol);

create index if not exists idx_holdings_user_id
on public.holdings(user_id);

create index if not exists ix_holdings_user_id_symbol
on public.holdings(user_id, symbol);

create index if not exists ix_orders_user_id_created_at
on public.orders(user_id, created_at);

drop index if exists public.idx_admin_actions_target_user_created_at;
drop index if exists public.idx_admin_actions_admin_user_created_at;

create index if not exists idx_admin_actions_target_user_id
on public.admin_actions(target_user_id);

create index if not exists ix_admin_actions_user_id_created_at
on public.admin_actions(target_user_id, created_at);

create index if not exists ix_admin_actions_admin_user_id_created_at
on public.admin_actions(admin_user_id, created_at);
