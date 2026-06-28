create unique index if not exists holdings_user_id_symbol_key
on public.holdings(user_id, symbol);
