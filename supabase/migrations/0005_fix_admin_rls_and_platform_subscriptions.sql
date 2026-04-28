-- Corrige a função usada pelas políticas de admin.
-- Sem SECURITY DEFINER, algumas consultas podem cair em recursão de RLS
-- ou bloquear ações administrativas feitas por usuários logados como admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Garante que a tabela de mensalidades tenha RLS e seja acessível somente
-- para administradores pelo client normal. O service_role continua bypassando RLS.
alter table public.platform_subscriptions enable row level security;

drop policy if exists "platform subscriptions admin all" on public.platform_subscriptions;

create policy "platform subscriptions admin all" on public.platform_subscriptions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Mantém a role anon sem acesso direto às assinaturas da plataforma.
drop policy if exists "platform subscriptions public none" on public.platform_subscriptions;
