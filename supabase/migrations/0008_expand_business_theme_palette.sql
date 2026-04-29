alter table public.businesses
  drop constraint if exists businesses_theme_key_check;

alter table public.businesses
  add constraint businesses_theme_key_check
  check (
    theme_key in (
      'barber_dark',
      'barber_blue',
      'barber_green',
      'black_gold',
      'beauty_soft',
      'rose_lux',
      'lilac_glow',
      'nude_chic',
      'lux_gold',
      'clean_clinic',
      'clinic_blue',
      'emerald_calm',
      'modern_neutral',
      'modern_dark',
      'ocean_blue',
      'royal_purple',
      'terracotta',
      'sunset_coral',
      'mocha',
      'graphite_cyan'
    )
  );
