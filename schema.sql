create extension if not exists pgcrypto;

create table if not exists public.rebate_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rebate_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_id uuid not null references public.rebate_periods(id) on delete cascade,
  plu text not null,
  description text not null,
  size_pack text,
  scan_program text,
  rebate_amount numeric(10,2) not null default 0,
  start_date date not null,
  end_date date not null,
  units_required integer not null default 1 check (units_required > 0),
  qty_sold integer not null default 0 check (qty_sold >= 0),
  rebate_qualified integer not null default 0 check (rebate_qualified >= 0),
  item_price numeric(10,2) not null default 0 check (item_price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, period_id, plu)
);

alter table public.rebate_periods enable row level security;
alter table public.rebate_programs enable row level security;

drop policy if exists "period_owner" on public.rebate_periods;
create policy "period_owner" on public.rebate_periods
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "program_owner" on public.rebate_programs;
create policy "program_owner" on public.rebate_programs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
