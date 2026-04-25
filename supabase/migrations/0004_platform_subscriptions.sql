create table if not exists public.platform_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reference_month integer not null check (reference_month between 1 and 12),
  reference_year integer not null check (reference_year between 2024 and 2100),
  amount numeric(10,2) not null default 69.90,
  status text not null default 'pending' check (status in ('paid', 'pending', 'overdue', 'waived')),
  due_date date not null,
  paid_at timestamptz null,
  payment_method text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, reference_month, reference_year)
);

create index if not exists idx_platform_subscriptions_business_id
  on public.platform_subscriptions (business_id);

create index if not exists idx_platform_subscriptions_reference
  on public.platform_subscriptions (reference_year, reference_month);

create index if not exists idx_platform_subscriptions_status_due_date
  on public.platform_subscriptions (status, due_date);

update public.platform_subscriptions
set updated_at = now()
where updated_at is null;

insert into public.platform_subscriptions (
  business_id,
  reference_month,
  reference_year,
  amount,
  status,
  due_date,
  notes
)
select
  b.id,
  extract(month from current_date)::int,
  extract(year from current_date)::int,
  69.90,
  case
    when b.status = 'blocked' then 'overdue'
    else 'pending'
  end,
  make_date(
    extract(year from current_date)::int,
    extract(month from current_date)::int,
    10
  ),
  'Mensalidade criada automaticamente na ativação do módulo SaaS.'
from public.businesses b
where not exists (
  select 1
  from public.platform_subscriptions ps
  where ps.business_id = b.id
    and ps.reference_month = extract(month from current_date)::int
    and ps.reference_year = extract(year from current_date)::int
);
