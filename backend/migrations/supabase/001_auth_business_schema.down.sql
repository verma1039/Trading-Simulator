-- Rollback for 001_auth_business_schema.up.sql.
-- This removes only the migration-prep objects introduced for the Supabase
-- architecture. It does not touch Supabase Auth's auth.users table.

drop policy if exists admin_actions_select_related on public.admin_actions;
drop policy if exists cash_ledger_select_own on public.cash_ledger;
drop policy if exists trades_select_own on public.trades;
drop policy if exists orders_select_own on public.orders;
drop policy if exists holdings_select_own on public.holdings;
drop policy if exists wallets_select_own on public.wallets;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;

drop table if exists public.admin_actions;
drop table if exists public.cash_ledger;
drop table if exists public.trades;
drop table if exists public.orders;
drop table if exists public.holdings;
drop table if exists public.wallets;
drop table if exists public.profiles;

drop function if exists public.prevent_profile_privilege_escalation();
drop function if exists public.set_updated_at();
