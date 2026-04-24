alter table public.businesses
  add column if not exists booking_interval_minutes integer not null default 15,
  add column if not exists booking_window_days integer not null default 30,
  add column if not exists booking_lead_time_hours integer not null default 2,
  add column if not exists tagline text,
  add column if not exists public_note text;

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  open_time text not null default '09:00',
  close_time text not null default '18:00',
  created_at timestamptz not null default now(),
  unique (business_id, day_of_week)
);

alter table public.appointments
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists end_time text,
  add column if not exists final_price numeric(10,2) not null default 0,
  add column if not exists paid_amount numeric(10,2) not null default 0,
  add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'partial', 'refunded', 'cancelled')),
  add column if not exists payment_method text check (payment_method in ('pix', 'cash', 'credit_card', 'debit_card', 'transfer')),
  add column if not exists completed_at timestamptz,
  add column if not exists cancellation_reason text;

alter table public.booking_requests
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_date date,
  add column if not exists approved_time text;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  additional_amount numeric(10,2) not null default 0,
  final_amount numeric(10,2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'partial', 'refunded', 'cancelled')),
  payment_method text check (payment_method in ('pix', 'cash', 'credit_card', 'debit_card', 'transfer')),
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_business_date on public.appointments (business_id, appointment_date);
create index if not exists idx_payments_business_paid_at on public.payments (business_id, paid_at);
create index if not exists idx_booking_requests_business_status on public.booking_requests (business_id, status);
create index if not exists idx_business_hours_business on public.business_hours (business_id);

update public.appointments
set
  end_time = coalesce(end_time, to_char((appointment_time::time + make_interval(mins => duration_minutes))::time, 'HH24:MI')),
  final_price = case when final_price = 0 then coalesce((select price from public.services where id = appointments.service_id), 0) else final_price end,
  paid_amount = final_price,
  payment_status = case when status = 'completed' then 'paid' else payment_status end,
  completed_at = case when status = 'completed' and completed_at is null then now() else completed_at end;

insert into public.payments (business_id, appointment_id, customer_id, service_id, amount, final_amount, payment_status, payment_method, paid_at, notes)
select
  business_id,
  id,
  customer_id,
  service_id,
  final_price,
  paid_amount,
  payment_status,
  payment_method,
  completed_at,
  'Importado automaticamente na atualização do produto'
from public.appointments a
where a.status = 'completed'
  and not exists (select 1 from public.payments p where p.appointment_id = a.id);

create or replace function public.seed_default_business_hours(target_business_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
  values
    (target_business_id, 0, false, '09:00', '18:00'),
    (target_business_id, 1, true, '09:00', '18:00'),
    (target_business_id, 2, true, '09:00', '18:00'),
    (target_business_id, 3, true, '09:00', '18:00'),
    (target_business_id, 4, true, '09:00', '18:00'),
    (target_business_id, 5, true, '09:00', '18:00'),
    (target_business_id, 6, true, '09:00', '15:00')
  on conflict (business_id, day_of_week) do nothing;
end;
$$;

select public.seed_default_business_hours(id) from public.businesses;

create or replace function public.handle_new_business_defaults()
returns trigger
language plpgsql
as $$
begin
  perform public.seed_default_business_hours(new.id);
  return new;
end;
$$;

drop trigger if exists trg_business_defaults on public.businesses;
create trigger trg_business_defaults
after insert on public.businesses
for each row execute function public.handle_new_business_defaults();

alter table public.business_hours enable row level security;
alter table public.payments enable row level security;

create policy "business hours admin all" on public.business_hours
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "business hours owner all" on public.business_hours
for all to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
);

create policy "payments admin all" on public.payments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "payments owner all" on public.payments
for all to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
);
