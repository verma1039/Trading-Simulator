# Supabase Migration Schema

Supabase Auth remains the source of users. The application does not create a
custom users table; every user-owned table points to `auth.users(id)`.

## Relationship Diagram

~~~text
auth.users
  id uuid PK
    |
    | 1:1
    v
public.profiles
  id uuid PK
  user_id uuid FK -> auth.users.id UNIQUE
  display_name
  role
  status
  created_at
  updated_at

auth.users
    |
    | 1:1
    v
public.wallets
  id uuid PK
  user_id uuid FK -> auth.users.id UNIQUE
  balance
  created_at
  updated_at
    |
    | 1:N
    v
public.cash_ledger
  id uuid PK
  user_id uuid FK -> auth.users.id
  wallet_id uuid FK -> wallets.id
  order_id uuid FK -> orders.id nullable
  trade_id uuid FK -> trades.id nullable
  type
  symbol nullable
  amount
  balance
  created_at
  updated_at

auth.users
    |
    | 1:N
    v
public.holdings
  id uuid PK
  user_id uuid FK -> auth.users.id
  symbol
  quantity
  avg_price
  created_at
  updated_at
  UNIQUE(user_id, symbol)

auth.users
    |
    | 1:N
    v
public.orders
  id uuid PK
  user_id uuid FK -> auth.users.id
  symbol
  side
  quantity
  status
  requested_price nullable
  executed_price nullable
  created_at
  updated_at
    |
    | 1:N
    v
public.trades
  id uuid PK
  user_id uuid FK -> auth.users.id
  order_id uuid FK -> orders.id nullable
  symbol
  side
  quantity
  price
  realized_pnl
  created_at
  updated_at
    |
    | 1:N
    v
public.cash_ledger

auth.users
    |
    | affected user
    v
public.admin_actions
  id uuid PK
  target_user_id uuid FK -> auth.users.id
  admin_user_id uuid FK -> auth.users.id nullable
  action
  metadata jsonb
  reason nullable
  created_at
  updated_at
~~~

## Constraints

- `profiles.user_id` is unique so each Supabase Auth user has at most one app profile.
- `profiles.role` is constrained to `user` or `admin`.
- `profiles.status` is constrained to `ACTIVE`, `SUSPENDED`, or `BANNED`.
- `wallets.user_id` is unique so each Supabase Auth user has one wallet.
- `wallets.balance` must be non-negative.
- `holdings` uses `UNIQUE(user_id, symbol)` so multiple users can hold the same symbol independently.
- `holdings.quantity` and `holdings.avg_price` must be non-negative.
- `orders`, `trades`, `cash_ledger`, and `admin_actions` are user-scoped.
- `admin_actions.target_user_id` stores the affected user.
- `admin_actions.admin_user_id` stores the administrator who performed the action.
- `created_at` defaults to `now()`.
- `updated_at` is maintained by the `public.set_updated_at()` trigger in the migration.

## Row-Level Security

The migration enables RLS for all public business tables.

Authenticated users can select only their own profile, wallet, holdings, orders,
trades, and ledger entries. Admin action rows are visible to the affected user,
the acting admin, and users whose profile role is `admin`.

Profile writes are restricted so browser/authenticated clients can update only
safe profile fields. The `public.prevent_profile_privilege_escalation()`
trigger and column grants prevent authenticated clients from changing
`profiles.role` or `profiles.status`. Role and status changes must happen
through a trusted backend/admin path or service-role database access.

