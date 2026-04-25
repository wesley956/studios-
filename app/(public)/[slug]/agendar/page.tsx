import { notFound } from 'next/navigation';
import { createPublicBookingRequest } from '@/actions/public-bookings';
import { createClient } from '@/lib/supabase/server';
import { buildBookingCalendar } from '@/lib/schedule';
import { buildThemeStyleVars, getSuggestedThemeByBusinessType } from '@/lib/themes';
import { currencyBRL, whatsappLink } from '@/lib/utils';
import BookingForm from './booking-form';

export default async function BookingPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ success?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const success = resolvedSearchParams?.success === '1';

  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!business) notFound();

  const [{ data: services }, { data: businessHours }, { data: appointments }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('name'),
    supabase.from('business_hours').select('*').eq('business_id', business.id),
    supabase
      .from('appointments')
      .select('appointment_date, appointment_time, end_time, duration_minutes, status')
      .eq('business_id', business.id)
      .gte('appointment_date', new Date().toISOString().slice(0, 10))
  ]);

  if (!services?.length) notFound();

  async function handleCreatePublicBookingRequest(formData: FormData): Promise<void> {
    'use server';
    await createPublicBookingRequest(formData);
  }

  const calendars = Object.fromEntries(
    services.map((service) => [
      service.id,
      buildBookingCalendar({
        days: Number(business.booking_window_days || 30),
        durationMinutes: Number(service.duration_minutes || 60),
        slotIntervalMinutes: Number(business.booking_interval_minutes || 15),
        hours: businessHours || [],
        appointments: appointments || [],
        leadTimeHours: Number(business.booking_lead_time_hours || 2)
      })
    ])
  );

  const themeKey = business.theme_key || getSuggestedThemeByBusinessType(business.business_type);
  const themeVars = buildThemeStyleVars(themeKey);
  const isBarber = business.business_type === 'barbearia';

  return (
    <div
      style={themeVars}
      className={`min-h-screen bg-background text-text ${isBarber ? 'barber-texture' : ''}`}
    >
      <div className="public-hero-overlay border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Agendamento inteligente
          </p>
          <h1 className="mt-4 text-4xl font-serif leading-tight md:text-5xl">
            Escolha serviço, data disponível e envie sua solicitação
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
            Os horários abaixo já respeitam o funcionamento configurado pelo studio e evitam conflitos com a agenda atual.
          </p>

          {success && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
              <p className="font-medium">Solicitação enviada com sucesso.</p>
              <p className="mt-1 text-sm">
                Em breve o studio entrará em contato para confirmar seu atendimento.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-muted">Studio</p>
              <p className="mt-2 text-lg font-semibold">{business.business_name}</p>
              <p className="mt-1 text-sm text-muted">
                {business.tagline || 'Experiência profissional com atendimento por hora marcada.'}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-muted">Atendimento</p>
              <p className="mt-2 text-lg font-semibold">{business.city || 'Atendimento presencial'}</p>
              {business.address && <p className="mt-1 text-sm text-muted">{business.address}</p>}
            </div>

            <div className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-muted">Regras da agenda</p>
              <p className="mt-2 text-sm text-text">
                Antecedência mínima: <span className="font-semibold">{business.booking_lead_time_hours || 2}h</span>
              </p>
              <p className="mt-1 text-sm text-text">
                Janela de reserva: <span className="font-semibold">{business.booking_window_days || 30} dias</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
            <h2 className="text-2xl font-serif">Serviços disponíveis</h2>
            <p className="mt-2 text-sm text-muted">
              Escolha o serviço ideal antes de enviar a solicitação.
            </p>

            <div className="mt-6 grid gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-[1.5rem] border border-border bg-[var(--theme-surface-alt)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="mt-2 text-sm text-muted">{service.duration_minutes} min</p>
                    </div>
                    <p className="text-lg font-semibold">{currencyBRL(service.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {business.whatsapp && (
              <a
                href={whatsappLink(
                  business.whatsapp,
                  `Olá! Quero saber mais sobre os horários do ${business.business_name}.`
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-2xl border border-border bg-white px-5 py-3 text-sm font-medium transition hover:bg-primary-soft"
              >
                Prefere falar no WhatsApp? Clique aqui
              </a>
            )}
          </div>

          <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft">
            <BookingForm
              business={business}
              services={services}
              calendars={calendars}
              action={handleCreatePublicBookingRequest}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
