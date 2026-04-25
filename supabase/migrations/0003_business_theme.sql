alter table public.businesses
add column if not exists business_type text;

alter table public.businesses
add column if not exists theme_key text;

update public.businesses
set business_type = coalesce(nullif(business_type, ''), 'studio_geral');

update public.businesses
set theme_key = coalesce(nullif(theme_key, ''), 'modern_neutral');

alter table public.businesses
alter column business_type set default 'studio_geral';

alter table public.businesses
alter column theme_key set default 'modern_neutral';

alter table public.businesses
alter column business_type set not null;

alter table public.businesses
alter column theme_key set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_business_type_check'
  ) then
    alter table public.businesses
    add constraint businesses_business_type_check
    check (
      business_type in (
        'barbearia',
        'salao',
        'estetica',
        'nail_designer',
        'cilios',
        'studio_geral'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_theme_key_check'
  ) then
    alter table public.businesses
    add constraint businesses_theme_key_check
    check (
      theme_key in (
        'barber_dark',
        'beauty_soft',
        'lux_gold',
        'clean_clinic',
        'modern_neutral'
      )
    );
  end if;
end $$;
