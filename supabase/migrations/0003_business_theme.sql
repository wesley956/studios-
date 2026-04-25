alter table public.businesses
add column if not exists business_type text not null default 'studio_geral';

alter table public.businesses
add column if not exists theme_key text not null default 'modern_neutral';

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

update public.businesses
set
  business_type = case
    when business_type is null or business_type = '' then 'studio_geral'
    else business_type
  end,
  theme_key = case
    when theme_key is null or theme_key = '' then 'modern_neutral'
    else theme_key
  end;
