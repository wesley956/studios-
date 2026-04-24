'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { bookingRequestSchema } from '@/lib/validations/booking';
import { calculateEndTime, appointmentsOverlap, isWithinBusinessHours } from '@/lib/schedule';

export async function createPublicBookingRequest(formData: FormData): Promise<void> {
  const returnTo = String(formData.get('returnTo') || '/');

  const parsed = bookingRequestSchema.safeParse({
    businessId: formData.get('businessId'),
    serviceId: formData.get('serviceId'),
    requestedDate: formData.get('requestedDate'),
    requestedTime: formData.get('requestedTime'),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    notes: formData.get('notes')
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, slug, status, booking_window_days, booking_lead_time_hours')
    .eq('id', parsed.data.businessId)
    .eq('status', 'active')
    .single();

  if (businessError || !business) throw new Error('Negócio indisponível para agendamento.');

  const { data: service } = await supabase
    .from('services')
    .select('id, business_id, duration_minutes, is_active')
    .eq('id', parsed.data.serviceId)
    .eq('business_id', business.id)
    .eq('is_active', true)
    .single();

  if (!service) throw new Error('Serviço inválido para este studio.');

  const requestedAt = new Date(`${parsed.data.requestedDate}T${parsed.data.requestedTime}:00`);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + Number(business.booking_window_days || 30));

  if (requestedAt.getTime() < Date.now() + Number(business.booking_lead_time_hours || 2) * 60 * 60 * 1000) {
    throw new Error('Escolha um horário com antecedência mínima configurada pelo studio.');
  }

  if (requestedAt > maxDate) {
    throw new Error('A data escolhida está fora da janela de agendamento disponível.');
  }

  const [{ data: appointments }, { data: businessHours }] = await Promise.all([
    supabase
      .from('appointments')
      .select('appointment_date, appointment_time, end_time, duration_minutes, status')
      .eq('business_id', business.id)
      .eq('appointment_date', parsed.data.requestedDate),
    supabase.from('business_hours').select('*').eq('business_id', business.id)
  ]);

  const endTime = calculateEndTime(parsed.data.requestedTime, Number(service.duration_minutes || 60));
  if (!isWithinBusinessHours({
    date: parsed.data.requestedDate,
    time: parsed.data.requestedTime,
    durationMinutes: Number(service.duration_minutes || 60),
    hours: businessHours || []
  })) {
    throw new Error('Esse horário está fora do funcionamento do studio.');
  }

  if (appointmentsOverlap({
    date: parsed.data.requestedDate,
    startTime: parsed.data.requestedTime,
    endTime,
    appointments: appointments || []
  })) {
    throw new Error('Esse horário acabou de ficar indisponível. Escolha outro.');
  }

  const { error } = await supabase.from('booking_requests').insert({
    business_id: business.id,
    service_id: parsed.data.serviceId || null,
    requested_date: parsed.data.requestedDate,
    requested_time: parsed.data.requestedTime,
    customer_name: parsed.data.customerName,
    customer_phone: parsed.data.customerPhone,
    notes: parsed.data.notes || null,
    status: 'pending',
    source: 'public_page'
  });

  if (error) throw new Error('Não foi possível enviar a solicitação.');

  redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}success=1`);
}
