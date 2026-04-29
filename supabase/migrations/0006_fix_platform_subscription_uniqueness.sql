-- Reforço de segurança para cobranças da plataforma.
-- Remove possíveis duplicidades criadas manualmente e garante índice único
-- por cliente + mês + ano.

with ranked_subscriptions as (
  select
    id,
    row_number() over (
      partition by business_id, reference_month, reference_year
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as row_number
  from public.platform_subscriptions
)
delete from public.platform_subscriptions ps
using ranked_subscriptions rs
where ps.id = rs.id
  and rs.row_number > 1;

create unique index if not exists platform_subscriptions_business_reference_unique_idx
  on public.platform_subscriptions (business_id, reference_month, reference_year);
