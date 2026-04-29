import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeBusinessHours } from '@/lib/schedule';
import { buildThemeStyleVars, getSuggestedThemeByBusinessType } from '@/lib/themes';
import { currencyBRL, formatTime, getInitials, statusLabel, whatsappLink } from '@/lib/utils';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const paymentLabels: Record<string, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  transfer: 'Transferência'
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  duration_minutes: number | null;
};

type GalleryImage = {
  id: string;
  image_url: string;
  sort_order: number | null;
};

function formatBusinessHourLabel(hour: {
  is_open: boolean;
  open_time: string;
  close_time: string;
}) {
  if (!hour.is_open) return 'Fechado';
  return `${formatTime(hour.open_time)} às ${formatTime(hour.close_time)}`;
}

function getNextOpenDays(hours: Array<{ day_of_week: number; is_open: boolean; open_time: string; close_time: string }>) {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const day = date.getDay();
    const hour = hours.find((item) => item.day_of_week === day);
    if (!hour?.is_open) return null;
    const label = index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : weekdays[day];
    return `${label}: ${formatTime(hour.open_time)} às ${formatTime(hour.close_time)}`;
  }).filter(Boolean).slice(0, 3) as string[];
}

export default async function PublicBusinessPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!business) notFound();

  const [{ data: services }, { data: gallery }, { data: businessHours }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, description, price, duration_minutes')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('gallery_images')
      .select('id, image_url, sort_order')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', business.id)
      .order('day_of_week', { ascending: true })
  ]);

  const activeServices = (services || []) as Service[];
  const galleryImages = (gallery || []) as GalleryImage[];
  const hours = normalizeBusinessHours(businessHours || []);
  const openDays = hours.filter((hour) => hour.is_open);
  const nextOpenDays = getNextOpenDays(hours);
  const themeKey = business.theme_key || getSuggestedThemeByBusinessType(business.business_type);
  const themeVars = buildThemeStyleVars(themeKey);
  const isBarber = business.business_type === 'barbearia';
  const instagramHandle = business.instagram ? String(business.instagram).replace('@', '') : null;
  const ctaLabel = business.custom_cta_label || 'Agendar horário';
  const showPrices = business.show_prices !== false;
  const showAddress = business.show_address !== false;
  const paymentMethods = Array.isArray(business.payment_methods) ? business.payment_methods : [];

  return (
    <div
      style={themeVars}
      className={`min-h-screen bg-background pb-24 text-text md:pb-0 ${isBarber ? 'barber-texture' : ''}`}
    >
      <section className="public-hero-overlay border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface text-lg font-semibold shadow-soft">
                {business.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(business.business_name)
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+</p>
                <p className="text-sm text-muted">{business.business_name}</p>
              </div>
            </Link>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${business.slug}/agendar`}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {ctaLabel}
              </Link>

              {business.whatsapp && (
                <a
                  href={whatsappLink(
                    business.whatsapp,
                    `Olá! Vim pela página do ${business.business_name} e quero tirar uma dúvida.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:bg-primary-soft"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Atendimento com hora marcada
              </p>

              <h1 className="mt-4 text-4xl font-serif leading-tight md:text-5xl">
                {business.business_name}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-muted md:text-lg">
                {business.tagline ||
                  business.description ||
                  'Confira serviços, horários de funcionamento, regras do atendimento e solicite seu horário pela página.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Localização</p>
                  <p className="mt-2 text-sm font-medium">
                    {showAddress ? business.address || business.city || 'Endereço não informado' : business.city || 'Local sob consulta'}
                  </p>
                  {business.map_url && showAddress ? (
                    <a href={business.map_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary">
                      Abrir no mapa
                    </a>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Funcionamento</p>
                  <p className="mt-2 text-sm font-medium">
                    {openDays.length ? `${openDays.length} dias por semana` : 'Horários não informados'}
                  </p>
                  {nextOpenDays[0] ? <p className="mt-2 text-xs text-muted">Próximo: {nextOpenDays[0]}</p> : null}
                </div>
              </div>

              {nextOpenDays.length ? (
                <div className="mt-5 rounded-2xl border border-border bg-surface p-4 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Próximos dias abertos</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nextOpenDays.map((item) => (
                      <span key={item} className="rounded-full border border-border bg-[var(--theme-surface-alt)] px-3 py-2 text-xs font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {business.public_note && (
                <div className="mt-5 rounded-2xl border border-border bg-primary-soft p-4 text-sm leading-6 text-text">
                  {business.public_note}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-border bg-surface p-4 shadow-soft">
              {business.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.cover_url}
                  alt={`Capa de ${business.business_name}`}
                  className="h-[340px] w-full rounded-[1.5rem] object-cover"
                />
              ) : (
                <div className="flex h-[340px] items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-primary-soft p-8 text-center text-muted">
                  Foto de capa ainda não enviada.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-serif">Serviços disponíveis</h2>
                <p className="mt-2 text-sm text-muted">Veja serviços, duração e informações antes de solicitar seu horário.</p>
              </div>

              <Link
                href={`/${business.slug}/agendar`}
                className="rounded-2xl bg-primary px-5 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
              >
                {ctaLabel}
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {activeServices.map((service) => (
                <div key={service.id} className="rounded-[1.5rem] border border-border bg-[var(--theme-surface-alt)] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{service.name}</h3>
                      {service.description && <p className="mt-2 text-sm leading-6 text-muted">{service.description}</p>}
                    </div>

                    <div className="shrink-0 text-left md:text-right">
                      <p className="text-sm text-muted">{service.duration_minutes || 60} min</p>
                      {showPrices ? <p className="mt-1 text-lg font-semibold">{currencyBRL(service.price)}</p> : null}
                    </div>
                  </div>
                </div>
              ))}

              {!activeServices.length && (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-[var(--theme-surface-alt)] p-6 text-sm text-muted">
                  Este negócio ainda não publicou serviços ativos.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
              <h2 className="text-2xl font-serif">Dias e horários</h2>
              <p className="mt-2 text-sm text-muted">Confira quando o atendimento está disponível antes de solicitar seu horário.</p>

              <div className="mt-6 grid gap-3">
                {hours.map((hour) => (
                  <div key={hour.day_of_week} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-[var(--theme-surface-alt)] px-4 py-3 text-sm">
                    <span className="font-medium">{weekdays[hour.day_of_week]}</span>
                    <span className={hour.is_open ? 'text-text' : 'text-muted'}>{formatBusinessHourLabel(hour)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
              <h2 className="text-2xl font-serif">Informações úteis</h2>
              <div className="mt-5 grid gap-3 text-sm text-muted">
                {business.city && <p><span className="font-medium text-text">Cidade:</span> {business.city}</p>}
                {business.address && showAddress && <p><span className="font-medium text-text">Endereço:</span> {business.address}</p>}
                {business.whatsapp && <p><span className="font-medium text-text">WhatsApp:</span> {business.whatsapp}</p>}
                {instagramHandle && <p><span className="font-medium text-text">Instagram:</span> @{instagramHandle}</p>}
              </div>

              {paymentMethods.length ? (
                <div className="mt-5">
                  <p className="text-sm font-medium text-text">Formas de pagamento</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {paymentMethods.map((method: string) => (
                      <span key={method} className="rounded-full border border-border bg-[var(--theme-surface-alt)] px-3 py-2 text-xs font-medium">
                        {paymentLabels[method] || statusLabel(method)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {business.map_url && showAddress ? (
                <a href={business.map_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:bg-primary-soft">
                  Abrir localização
                </a>
              ) : null}
            </div>

            {(business.booking_rules || business.cancellation_policy) && (
              <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
                <h2 className="text-2xl font-serif">Regras do atendimento</h2>
                <div className="mt-5 space-y-4 text-sm leading-6 text-muted">
                  {business.booking_rules ? <p><span className="font-medium text-text">Antes de agendar:</span> {business.booking_rules}</p> : null}
                  {business.cancellation_policy ? <p><span className="font-medium text-text">Cancelamento:</span> {business.cancellation_policy}</p> : null}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {galleryImages.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
          <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-serif">Fotos</h2>
                <p className="mt-2 text-sm text-muted">Conheça um pouco mais do espaço, dos resultados e da identidade do atendimento.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {galleryImages.map((item, index) => (
                <div key={item.id || index} className="overflow-hidden rounded-[1.5rem] border border-border bg-[var(--theme-surface-alt)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt={`Foto ${index + 1} de ${business.business_name}`} className="h-72 w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-2 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-primary-soft p-8 text-center shadow-soft">
          <h2 className="text-3xl font-serif">Quer reservar seu horário?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted">
            Escolha um serviço, veja os horários disponíveis e envie sua solicitação para confirmação.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/${business.slug}/agendar`} className="rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
              {ctaLabel}
            </Link>

            {business.whatsapp && (
              <a
                href={whatsappLink(business.whatsapp, `Olá! Quero reservar um horário no ${business.business_name}.`)}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-border bg-surface px-6 py-3 text-sm font-medium transition hover:bg-white"
              >
                Chamar no WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 p-3 shadow-soft backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl gap-2">
          <Link href={`/${business.slug}/agendar`} className="flex-1 rounded-2xl bg-primary px-4 py-3 text-center text-sm font-medium text-white">
            {ctaLabel}
          </Link>
          {business.whatsapp ? (
            <a href={whatsappLink(business.whatsapp, `Olá! Quero tirar uma dúvida sobre ${business.business_name}.`)} target="_blank" rel="noreferrer" className="rounded-2xl border border-border px-4 py-3 text-sm font-medium">
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
