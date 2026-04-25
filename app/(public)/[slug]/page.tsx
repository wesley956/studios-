import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buildThemeStyleVars, getSuggestedThemeByBusinessType } from '@/lib/themes';
import { currencyBRL, getInitials, whatsappLink } from '@/lib/utils';

export default async function PublicBusinessPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!business) notFound();

  const [{ data: services }, { data: gallery }, { count: customersCount }] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('gallery_images')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
  ]);

  const highlightServices = services?.slice(0, 3) || [];
  const themeKey = business.theme_key || getSuggestedThemeByBusinessType(business.business_type);
  const themeVars = buildThemeStyleVars(themeKey);
  const isBarber = business.business_type === 'barbearia';

  const heroTitle =
    business.business_type === 'barbearia'
      ? 'Barbearia com presença forte e agendamento profissional'
      : 'Página profissional com agendamento inteligente';

  return (
    <div
      style={themeVars}
      className={`min-h-screen bg-background text-text ${isBarber ? 'barber-texture' : ''}`}
    >
      <section className="public-hero-overlay border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-lg font-semibold shadow-soft">
                {business.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logo_url}
                    alt={business.business_name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  getInitials(business.business_name)
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+</p>
                <p className="text-sm text-muted">{heroTitle}</p>
              </div>
            </Link>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${business.slug}/agendar`}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Agendar horário
              </Link>

              {business.whatsapp && (
                <a
                  href={whatsappLink(
                    business.whatsapp,
                    `Olá! Vim pela página do ${business.business_name} e quero saber mais.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:bg-primary-soft"
                >
                  Falar no WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                {business.business_type === 'barbearia'
                  ? 'Atendimento com estilo'
                  : 'Atendimento com hora marcada'}
              </p>

              <h1 className="mt-4 text-4xl font-serif leading-tight md:text-5xl">
                {business.business_name}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-muted md:text-lg">
                {business.tagline ||
                  business.description ||
                  'Atendimento com hora marcada, experiência premium e presença digital pronta para vender.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm">
                  {services?.length || 0} serviços ativos
                </span>
                <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm">
                  {customersCount || 0}+ clientes atendidas
                </span>
                <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm">
                  {business.city || 'Atendimento com hora marcada'}
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-surface p-4 shadow-soft">
              {business.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.cover_url}
                  alt={`Capa de ${business.business_name}`}
                  className="h-[320px] w-full rounded-[1.5rem] object-cover"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-primary-soft p-8 text-center text-muted">
                  Adicione uma capa bonita em Configurações para deixar sua página ainda mais premium.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Agendamento rápido',
              description: 'A cliente escolhe serviço, data disponível e horário real sem confusão.'
            },
            {
              title: 'Presença profissional',
              description: 'Página bonita, link próprio e apresentação alinhada ao tipo do seu negócio.'
            },
            {
              title: 'Confirmação humana',
              description: 'O pedido entra no painel e você aprova com segurança antes de confirmar.'
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-soft"
            >
              <h2 className="text-xl font-serif">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
            <h2 className="text-2xl font-serif">Sobre o espaço</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {business.description ||
                'Atendimento personalizado, ambiente acolhedor e serviços pensados para valorizar sua beleza com conforto e organização.'}
            </p>

            {business.public_note && (
              <div className="mt-5 rounded-2xl border border-border bg-primary-soft p-4 text-sm text-text">
                {business.public_note}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
              <span className="rounded-full border border-border px-4 py-2">
                {business.city || 'Atendimento com hora marcada'}
              </span>
              {business.address && (
                <span className="rounded-full border border-border px-4 py-2">{business.address}</span>
              )}
              {business.instagram && (
                <span className="rounded-full border border-border px-4 py-2">
                  @{String(business.instagram).replace('@', '')}
                </span>
              )}
              {business.whatsapp && (
                <span className="rounded-full border border-border px-4 py-2">
                  WhatsApp: {business.whatsapp}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif">Serviços</h2>
                <p className="mt-2 text-sm text-muted">O que você pode reservar agora mesmo.</p>
              </div>

              <Link
                href={`/${business.slug}/agendar`}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Solicitar horário
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {(services?.length ? services : []).map((service) => (
                <div
                  key={service.id}
                  className="rounded-[1.5rem] border border-border bg-[var(--theme-surface-alt)] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{service.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {service.description || 'Atendimento profissional com horário reservado.'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm text-muted">{service.duration_minutes} min</p>
                      <p className="mt-1 text-lg font-semibold">{currencyBRL(service.price)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {!services?.length && (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-[var(--theme-surface-alt)] p-6 text-sm text-muted">
                  Em breve este studio publicará seus serviços aqui.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-serif">Galeria</h2>
              <p className="mt-2 text-sm text-muted">
                Mostre resultados, ambiente e identidade visual do seu espaço.
              </p>
            </div>

            <Link
              href={`/${business.slug}/agendar`}
              className="rounded-2xl border border-border bg-white px-5 py-3 text-sm font-medium transition hover:bg-primary-soft"
            >
              Quero reservar
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(gallery?.length ? gallery : [{ id: '1' }, { id: '2' }, { id: '3' }]).map((item, index) => (
              <div
                key={typeof item.id === 'string' ? item.id : index}
                className="overflow-hidden rounded-[1.5rem] border border-border bg-[var(--theme-surface-alt)]"
              >
                {'image_url' in item && item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={`Imagem ${index + 1} de ${business.business_name}`}
                    className="h-72 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center p-6 text-center text-sm text-muted">
                    Espaço reservado para fotos do studio, resultados e ambiente.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-2 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-primary-soft p-8 text-center shadow-soft">
          <h2 className="text-3xl font-serif">Pronta para reservar seu horário?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted">
            Escolha um serviço, veja datas disponíveis e envie sua solicitação em poucos passos.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/${business.slug}/agendar`}
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Agendar agora
            </Link>

            {business.whatsapp && (
              <a
                href={whatsappLink(
                  business.whatsapp,
                  `Olá! Quero reservar um horário no ${business.business_name}.`
                )}
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
    </div>
  );
}
