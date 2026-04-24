create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  role text not null check (role in ('admin', 'client_owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  niche text not null default 'beauty_and_esthetics',
  city text,
  whatsapp text,
  instagram text,
  address text,
  description text,
  logo_url text,
  cover_url text,
  status text not null default 'trial' check (status in ('trial', 'active', 'blocked')),
  plan_name text not null default 'start',
  theme_name text not null default 'nude-premium',
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_minutes integer not null default 60,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text not null,
  birthday date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  service_id uuid references public.services(id) on delete set null,
  requested_date date not null,
  requested_time text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rescheduled', 'cancelled')),
  source text not null default 'public_page',
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  booking_request_id uuid references public.booking_requests(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  appointment_date date not null,
  appointment_time text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.booking_requests enable row level security;
alter table public.appointments enable row level security;
alter table public.gallery_images enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles self read" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles self update" on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "businesses admin all" on public.businesses
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "businesses owner read" on public.businesses
for select to authenticated
using (owner_id = auth.uid());

create policy "businesses owner update" on public.businesses
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "businesses public read active" on public.businesses
for select to anon, authenticated
using (status = 'active');

create policy "services admin all" on public.services
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "services owner all" on public.services
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

create policy "services public read active business" on public.services
for select to anon, authenticated
using (
  is_active = true and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'active'
  )
);

create policy "customers admin all" on public.customers
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "customers owner all" on public.customers
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

create policy "booking requests admin all" on public.booking_requests
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "booking requests owner all" on public.booking_requests
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

create policy "booking requests public insert" on public.booking_requests
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'active'
  )
);

create policy "appointments admin all" on public.appointments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "appointments owner all" on public.appointments
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

create policy "gallery admin all" on public.gallery_images
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "gallery owner all" on public.gallery_images
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

create policy "gallery public read" on public.gallery_images
for select to anon, authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'active'
  )
);
