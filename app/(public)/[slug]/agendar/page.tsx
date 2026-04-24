import { notFound } from 'next/navigation';
import { createPublicBookingRequest } from '@/actions/public-bookings';
import { createClient } from '@/lib/supabase/server';
import { buildBookingCalendar } from '@/lib/schedule';
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
    supabase.from('services').select('id, name, price, duration_minutes').eq('business_id', business.id).eq('is_active', true).order('name'),
    supabase.from('business_hours').select('*').eq('business_id', business.id),
    supabase.from('appointments').select('appointment_date, appointment_time, end_time, duration_minutes, status').eq('business_id', business.id).gte('appointment_date', new Date().toISOString().slice(0, 10))
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 max-w-3xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted">Agendamento inteligente</p>
        <h1 className="text-4xl md:text-5xl">Escolha serviço, data disponível e envie sua solicitação</h1>
        <p className="mt-3 text-muted">
          Os horários abaixo já respeitam o funcionamento configurado pelo studio e evitam conflitos com a agenda atual.
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="font-medium">Solicitação enviada com sucesso.</p>
          <p className="mt-1 text-sm text-muted">Em breve o studio entrará em contato para confirmar seu atendimento.</p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[0.92fr,1.08fr]">
        <aside className="space-y-4 rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl">{business.business_name}</h2>
            <p className="mt-2 text-sm text-muted">{business.tagline || 'Experiência profissional com atendimento por hora marcada.'}</p>
          </div>
          <div className="space-y-3 text-sm text-muted">
            <p>{business.city || 'Atendimento presencial'}</p>
            {business.address && <p>{business.address}</p>}
            <p>Antecedência mínima: {business.booking_lead_time_hours || 2}h</p>
            <p>Janela de reserva: {business.booking_window_days || 30} dias</p>
          </div>
          <div className="rounded-2xl bg-[#FBF7F3] p-4">
            <p className="text-sm text-muted">Serviços disponíveis</p>
            <div className="mt-3 space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium text-dark">{service.name}</p>
                    <p className="text-muted">{service.duration_minutes} min</p>
                  </div>
                  <span className="font-medium text-dark">{currencyBRL(service.price)}</span>
                </div>
              ))}
            </div>
          </div>
          {business.whatsapp && <a href={whatsappLink(business.whatsapp)} className="block text-primary" target="_blank" rel="noreferrer">Prefere falar no WhatsApp? Clique aqui</a>}
        </aside>

        <BookingForm
          businessId={business.id}
          returnTo={`/${business.slug}/agendar`}
          services={services}
          calendars={calendars}
          action={handleCreatePublicBookingRequest}
        />
      </div>
    </main>
  );
}
