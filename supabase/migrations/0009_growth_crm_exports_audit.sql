-- Studio+ v4: página pública mais completa, CRM, personalização comercial e auditoria.

alter table public.businesses
  add column if not exists payment_methods text[] not null default '{}',
  add column if not exists cancellation_policy text,
  add column if not exists booking_rules text,
  add column if not exists show_prices boolean not null default true,
  add column if not exists show_address boolean not null default true,
  add column if not exists map_url text,
  add column if not exists custom_cta_label text,
  add column if not exists instagram_bio text,
  add column if not exists whatsapp_status_text text;

alter table public.customers
  add column if not exists tags text[] not null default '{}',
  add column if not exists next_follow_up_date date,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists return_interval_days integer not null default 30,
  add column if not exists preferences text,
  add column if not exists restrictions text;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_business_created_at
  on public.audit_logs (business_id, created_at desc);

create index if not exists idx_customers_business_follow_up
  on public.customers (business_id, next_follow_up_date);

alter table public.audit_logs enable row level security;

-- Recria políticas de forma segura para evitar erro caso rode mais de uma vez.
drop policy if exists "audit logs admin read" on public.audit_logs;
drop policy if exists "audit logs owner read" on public.audit_logs;
drop policy if exists "audit logs service insert" on public.audit_logs;

create policy "audit logs admin read" on public.audit_logs
for select to authenticated
using (public.is_admin());

create policy "audit logs owner read" on public.audit_logs
for select to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
);

create policy "audit logs service insert" on public.audit_logs
for insert to authenticated
with check (public.is_admin() or exists (
  select 1 from public.businesses b
  where b.id = business_id and b.owner_id = auth.uid()
));
