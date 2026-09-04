alter table public.rebate_programs
add column if not exists rebate_qualified integer not null default 0
check (rebate_qualified >= 0);
