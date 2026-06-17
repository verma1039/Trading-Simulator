-- Supabase migration prep for user-scoped trading data.
-- Identity source: Supabase Auth via auth.users. This migration does not create
-- a custom users table.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name varchar(120),
  role varchar(32) not null default 'user',
  status varchar(32) not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_profiles_role check (role in ('user', 'admin')),
  constraint ck_profiles_status check (status in ('ACTIVE', 'SUSPENDED', 'BANNED'))
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric(14, 2) not null default 1000000.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_wallets_balance_non_negative check (balance >= 0)
);

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol varchar(32) not null,
  quantity integer not null default 0,
  avg_price numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_holdings_user_id_symbol unique (user_id, symbol),
  constraint ck_holdings_quantity_non_negative check (quantity >= 0),
  constraint ck_holdings_avg_price_non_negative check (avg_price >= 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol varchar(32) not null,
  side varchar(8) not null,
  quantity integer not null,
  status varchar(24) not null default 'PENDING',
  requested_price numeric(14, 4),
  executed_price numeric(14, 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_orders_side check (side in ('BUY', 'SELL')),
  constraint ck_orders_status check (status in ('PENDING', 'EXECUTED', 'REJECTED', 'CANCELLED')),
  constraint ck_orders_quantity_positive check (quantity > 0)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  symbol varchar(32) not null,
  side varchar(8) not null,
  quantity integer not null,
  price numeric(14, 4) not null,
  realized_pnl numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_trades_side check (side in ('BUY', 'SELL')),
  constraint ck_trades_quantity_positive check (quantity > 0),
  constraint ck_trades_price_non_negative check (price >= 0)
);

create table if not exists public.cash_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  trade_id uuid references public.trades(id) on delete set null,
  type varchar(40) not null,
  symbol varchar(32),
  amount numeric(14, 2) not null,
  balance numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_cash_ledger_type check (
    type in ('DEPOSIT', 'WITHDRAW', 'TRADE_BUY', 'TRADE_SELL', 'ADJUSTMENT')
  )
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  action varchar(80) not null,
  metadata jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_holdings_user_id_symbol
  on public.holdings(user_id, symbol);
create index if not exists ix_orders_user_id_created_at
  on public.orders(user_id, created_at);
create index if not exists ix_trades_user_id_created_at
  on public.trades(user_id, created_at);
create index if not exists ix_trades_order_id
  on public.trades(order_id);
create index if not exists ix_cash_ledger_user_id_created_at
  on public.cash_ledger(user_id, created_at);
create index if not exists ix_cash_ledger_wallet_id
  on public.cash_ledger(wallet_id);
create index if not exists ix_cash_ledger_order_id
  on public.cash_ledger(order_id);
create index if not exists ix_cash_ledger_trade_id
  on public.cash_ledger(trade_id);
create index if not exists ix_admin_actions_target_user_id_created_at
  on public.admin_actions(target_user_id, created_at);
create index if not exists ix_admin_actions_admin_user_id_created_at
  on public.admin_actions(admin_user_id, created_at);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_prevent_privilege_escalation on public.profiles;
create trigger trg_profiles_prevent_privilege_escalation
before insert or update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop trigger if exists trg_wallets_set_updated_at on public.wallets;
create trigger trg_wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

drop trigger if exists trg_holdings_set_updated_at on public.holdings;
create trigger trg_holdings_set_updated_at
before update on public.holdings
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_trades_set_updated_at on public.trades;
create trigger trg_trades_set_updated_at
before update on public.trades
for each row execute function public.set_updated_at();

drop trigger if exists trg_cash_ledger_set_updated_at on public.cash_ledger;
create trigger trg_cash_ledger_set_updated_at
before update on public.cash_ledger
for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_actions_set_updated_at on public.admin_actions;
create trigger trg_admin_actions_set_updated_at
before update on public.admin_actions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.holdings enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;
alter table public.cash_ledger enable row level security;
alter table public.admin_actions enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke insert, update on public.profiles from anon, authenticated;
grant insert (user_id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "wallets_select_own"
on public.wallets for select
using (auth.uid() = user_id);

create policy "holdings_select_own"
on public.holdings for select
using (auth.uid() = user_id);

create policy "orders_select_own"
on public.orders for select
using (auth.uid() = user_id);

create policy "trades_select_own"
on public.trades for select
using (auth.uid() = user_id);

create policy "cash_ledger_select_own"
on public.cash_ledger for select
using (auth.uid() = user_id);

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
