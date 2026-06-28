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

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'wallets', 'holdings', 'orders', 'transactions', 'deposit_requests', 'admin_actions')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists status text not null default 'ACTIVE',
  add column if not exists timezone text not null default 'Asia/Kolkata',
  add column if not exists last_active_at timestamptz not null default now();

alter table public.profiles
  alter column display_name type text,
  alter column role type text,
  alter column role set default 'USER';

update public.profiles
set role = upper(role)
where role is not null;

update public.profiles
set status = upper(status)
where status is not null;

update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and (p.email is null or p.email = '');

update public.profiles
set email = user_id::text || '@missing.local'
where email is null or email = '';

update public.profiles
set display_name = split_part(email, '@', 1)
where display_name is null or display_name = '';

alter table public.profiles
  alter column display_name set not null,
  alter column email set not null,
  alter column status set default 'ACTIVE',
  alter column status set not null,
  alter column timezone set default 'Asia/Kolkata',
  alter column timezone set not null,
  alter column last_active_at set default now(),
  alter column last_active_at set not null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end loop;
end $$;

do $$
begin
  alter table public.profiles add constraint profiles_role_check check (role in ('USER', 'ADMIN'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles add constraint profiles_status_check check (status in ('ACTIVE', 'SUSPENDED', 'BANNED'));
exception when duplicate_object then null;
end $$;

create unique index if not exists profiles_user_id_key on public.profiles(user_id);
create unique index if not exists profiles_email_key on public.profiles(email);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_email_unique'
  ) and not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profiles_email_unique'
  ) then
    alter table public.profiles add constraint profiles_email_unique unique (email);
  end if;
end $$;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wallets' and column_name = 'balance'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wallets' and column_name = 'cash_balance'
  ) then
    alter table public.wallets rename column balance to cash_balance;
  end if;
end $$;

alter table public.wallets
  add column if not exists cash_balance numeric(14, 2) not null default 0;

alter table public.wallets
  alter column cash_balance type numeric(14, 2),
  alter column cash_balance set default 0,
  alter column cash_balance set not null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.wallets'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.wallets drop constraint %I', constraint_name);
  end loop;
end $$;

do $$
begin
  alter table public.wallets add constraint wallets_cash_balance_check check (cash_balance >= 0);
exception when duplicate_object then null;
end $$;

create unique index if not exists wallets_user_id_key on public.wallets(user_id);

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  quantity integer not null default 0,
  avg_price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.holdings
  add column if not exists company text,
  add column if not exists sector text;

update public.holdings
set company = symbol
where company is null or company = '';

update public.holdings
set sector = 'Unknown'
where sector is null or sector = '';

delete from public.holdings
where quantity <= 0;

alter table public.holdings
  alter column symbol type text,
  alter column company set not null,
  alter column sector set not null,
  alter column avg_price type numeric(14, 4),
  alter column avg_price set not null,
  alter column quantity set not null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.holdings'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.holdings drop constraint %I', constraint_name);
  end loop;
end $$;

do $$
begin
  alter table public.holdings add constraint holdings_quantity_check check (quantity > 0);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.holdings add constraint holdings_avg_price_check check (avg_price >= 0);
exception when duplicate_object then null;
end $$;

create unique index if not exists holdings_user_id_symbol_key on public.holdings(user_id, symbol);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  side text not null,
  quantity integer not null,
  status text not null default 'APPROVED',
  requested_price numeric,
  executed_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

update public.orders
set side = upper(side),
    status = upper(status);

update public.orders
set requested_price = coalesce(requested_price, 0),
    executed_price = coalesce(executed_price, requested_price, 0);

alter table public.orders
  alter column symbol type text,
  alter column side type text,
  alter column status type text,
  alter column status set default 'APPROVED',
  alter column requested_price type numeric(14, 4),
  alter column requested_price set not null,
  alter column executed_price type numeric(14, 4),
  alter column executed_price set not null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.orders drop constraint %I', constraint_name);
  end loop;
end $$;

do $$ begin alter table public.orders add constraint orders_side_check check (side in ('BUY', 'SELL')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_quantity_check check (quantity > 0); exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_requested_price_check check (requested_price >= 0); exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_executed_price_check check (executed_price >= 0); exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_status_check check (status in ('PENDING', 'APPROVED', 'REJECTED')); exception when duplicate_object then null; end $$;

create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  notes text not null default '',
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('DEPOSIT', 'BUY', 'SELL')),
  status text not null default 'APPROVED' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  amount numeric(14, 2) not null,
  detail text not null default '',
  related_order_id uuid references public.orders(id) on delete set null,
  related_deposit_request_id uuid references public.deposit_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_actions' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_actions' and column_name = 'target_user_id'
  ) then
    alter table public.admin_actions rename column user_id to target_user_id;
  end if;
end $$;

alter table public.admin_actions
  add column if not exists target_user_id uuid references auth.users(id) on delete cascade;

alter table public.admin_actions
  alter column action type text,
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null;

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_role_status on public.profiles(role, status);
create index if not exists idx_wallets_user_id on public.wallets(user_id);
create index if not exists idx_holdings_user_id on public.holdings(user_id);
create index if not exists idx_orders_user_id_created_at on public.orders(user_id, created_at desc);
create index if not exists idx_transactions_user_id_created_at on public.transactions(user_id, created_at desc);
create index if not exists idx_transactions_deposit_request on public.transactions(related_deposit_request_id);
create index if not exists idx_deposit_requests_user_status on public.deposit_requests(user_id, status);
create index if not exists idx_deposit_requests_status_created_at on public.deposit_requests(status, created_at desc);
create index if not exists idx_admin_actions_created_at on public.admin_actions(created_at desc);
create index if not exists idx_admin_actions_target_user_id on public.admin_actions(target_user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_wallets_updated_at on public.wallets;
create trigger set_wallets_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

drop trigger if exists set_holdings_updated_at on public.holdings;
create trigger set_holdings_updated_at
before update on public.holdings
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_deposit_requests_updated_at on public.deposit_requests;
create trigger set_deposit_requests_updated_at
before update on public.deposit_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_actions_updated_at on public.admin_actions;
create trigger set_admin_actions_updated_at
before update on public.admin_actions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.holdings enable row level security;
alter table public.orders enable row level security;
alter table public.transactions enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.admin_actions enable row level security;

grant select on public.profiles to authenticated;
grant select on public.wallets to authenticated;
grant select on public.holdings to authenticated;
grant select on public.orders to authenticated;
grant select on public.transactions to authenticated;
grant select on public.deposit_requests to authenticated;
grant select on public.admin_actions to authenticated;

drop policy if exists "Profiles are visible to owner" on public.profiles;
create policy "Profiles are visible to owner"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Wallets are visible to owner" on public.wallets;
create policy "Wallets are visible to owner"
on public.wallets
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Holdings are visible to owner" on public.holdings;
create policy "Holdings are visible to owner"
on public.holdings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Orders are visible to owner" on public.orders;
create policy "Orders are visible to owner"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Transactions are visible to owner" on public.transactions;
create policy "Transactions are visible to owner"
on public.transactions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Deposit requests are visible to owner" on public.deposit_requests;
create policy "Deposit requests are visible to owner"
on public.deposit_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admin actions are visible to affected owner" on public.admin_actions;
create policy "Admin actions are visible to affected owner"
on public.admin_actions
for select
to authenticated
using (target_user_id = auth.uid() or admin_user_id = auth.uid());
