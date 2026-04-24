import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { currencyBRL, getInitials, whatsappLink } from '@/lib/utils';

export default async function PublicBusinessPage({ params }: { params: Promise<{ slug: string }> }) {
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
    supabase.from('services').select('*').eq('business_id', business.id).eq('is_active', true).order('created_at', { ascending: true }),
    supabase.from('gallery_images').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', business.id)
  ]);

  const highlightServices = services?.slice(0, 3) || [];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-[#F1E7DE]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.05fr,0.95fr] md:items-center">
          <div>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-xl font-semibold shadow-sm">
                {business.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logo_url} alt={business.business_name} className="h-full w-full rounded-[1.5rem] object-cover" />
                ) : getInitials(business.business_name)}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted">Studio+</p>
                <p className="mt-1 text-sm text-muted">Página profissional com agendamento inteligente</p>
              </div>
            </div>
            <h1 className="text-5xl leading-tight md:text-6xl">{business.business_name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              {business.tagline || business.description || 'Atendimento com hora marcada, experiência premium e presença digital pronta para vender.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${business.slug}/agendar`} className="rounded-2xl bg-primary px-6 py-3 text-white">Agendar horário</Link>
              {business.whatsapp && (
                <a href={whatsappLink(business.whatsapp, `Olá! Quero agendar no ${business.business_name}.`)} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-white px-6 py-3">Falar no WhatsApp</a>
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-sm text-muted">Serviços ativos</p><p className="mt-1 text-2xl font-semibold">{services?.length || 0}</p></div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-sm text-muted">Clientes atendidas</p><p className="mt-1 text-2xl font-semibold">{customersCount || 0}+</p></div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-sm text-muted">Cidade</p><p className="mt-1 text-2xl font-semibold">{business.city || 'Online'}</p></div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-white p-4 shadow-sm">
            <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#E9DED5]">
              {business.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.cover_url} alt={business.business_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-muted">
                  Adicione uma capa bonita em Configurações para deixar sua página ainda mais premium.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Agendamento rápido',
              description: 'A cliente escolhe serviço, data disponível e horário real sem confusão.'
            },
            {
              title: 'Atendimento com presença',
              description: 'Página bonita, link próprio e apresentação profissional do seu negócio.'
            },
            {
              title: 'Confirmação humana',
              description: 'O pedido entra no painel e você aprova com segurança antes de confirmar.'
            }
          ].map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
              <h2 className="text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-3xl">Sobre o espaço</h2>
              <p className="mt-3 max-w-2xl text-muted">
                {business.description || 'Atendimento personalizado, ambiente acolhedor e serviços pensados para valorizar sua beleza com conforto e organização.'}
              </p>
              {business.public_note && (
                <div className="mt-4 rounded-2xl bg-[#FBF7F3] px-4 py-3 text-sm text-muted">
                  {business.public_note}
                </div>
              )}
            </div>
            <div className="min-w-[280px] rounded-2xl bg-[#FBF7F3] px-5 py-4 text-sm text-muted">
              <p>{business.city || 'Atendimento com hora marcada'}</p>
              {business.address && <p className="mt-2">{business.address}</p>}
              {business.instagram && <p className="mt-2">@{String(business.instagram).replace('@', '')}</p>}
              {business.whatsapp && <p className="mt-2">WhatsApp: {business.whatsapp}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl">Serviços</h2>
            <p className="mt-2 text-muted">O que você pode reservar agora mesmo.</p>
          </div>
          <Link href={`/${business.slug}/agendar`} className="text-sm text-primary">Solicitar horário</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(services?.length ? services : []).map((service) => (
            <div key={service.id} className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
              <h3 className="text-xl">{service.name}</h3>
              <p className="mt-2 text-sm text-muted">{service.description || 'Atendimento profissional com horário reservado.'}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted">{service.duration_minutes} min</span>
                <span className="font-medium">{currencyBRL(service.price)}</span>
              </div>
            </div>
          ))}
          {!services?.length && (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-white p-6 text-muted shadow-sm">
              Em breve este studio publicará seus serviços aqui.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">Galeria</h2>
              <p className="mt-2 text-muted">Mostre resultados, ambiente e identidade visual do seu espaço.</p>
            </div>
            <Link href={`/${business.slug}/agendar`} className="text-sm text-primary">Quero reservar</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(gallery?.length ? gallery : [{ id: '1' }, { id: '2' }, { id: '3' }]).map((item, index) => (
              <div key={item.id || index} className="aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-border bg-[#EFE6DE]">
                {'image_url' in item && item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={`Galeria ${index + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
                    Espaço reservado para fotos do studio, resultados e ambiente.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-[2rem] border border-border bg-dark px-8 py-10 text-white shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl">Pronta para reservar seu horário?</h2>
              <p className="mt-3 max-w-2xl text-white/70">Escolha um serviço, veja datas disponíveis e envie sua solicitação em poucos passos.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${business.slug}/agendar`} className="rounded-2xl bg-primary px-6 py-3 text-white">Agendar agora</Link>
              {business.whatsapp && (
                <a href={whatsappLink(business.whatsapp)} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3">Chamar no WhatsApp</a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
