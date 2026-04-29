'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { bookingRequestSchema } from '@/lib/validations/booking';
import { calculateEndTime, appointmentsOverlap, isWithinBusinessHours, type AppointmentSlot } from '@/lib/schedule';

type RequestBusySlot = {
  id?: string;
  requested_date: string;
  requested_time: string;
  status?: string | null;
  services?: { duration_minutes?: number | null } | { duration_minutes?: number | null }[] | null;
};

function buildRedirectUrl(returnTo: string, key: 'success' | 'error', message: string) {
  const fallback = returnTo || '/';
  return `${fallback}${fallback.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(message)}`;
}

function fail(returnTo: string, message: string): never {
  redirect(buildRedirectUrl(returnTo, 'error', message));
}

function success(returnTo: string): never {
  redirect(buildRedirectUrl(returnTo, 'success', '1'));
}

function getRequestDurationMinutes(request: RequestBusySlot) {
  const service = Array.isArray(request.services) ? request.services[0] : request.services;
  return Number(service?.duration_minutes || 60);
}

function bookingRequestsToBusySlots(requests: RequestBusySlot[]): AppointmentSlot[] {
  return requests.map((request) => {
    const durationMinutes = getRequestDurationMinutes(request);

    return {
      id: request.id,
      appointment_date: request.requested_date,
      appointment_time: request.requested_time,
      end_time: calculateEndTime(request.requested_time, durationMinutes),
      duration_minutes: durationMinutes,
      status: request.status || 'pending'
    };
  });
}

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
    fail(returnTo, parsed.error.issues[0]?.message || 'Dados inválidos. Confira as informações e tente novamente.');
  }

  const supabase = createAdminClient();
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, slug, status, booking_window_days, booking_lead_time_hours')
    .eq('id', parsed.data.businessId)
    .eq('status', 'active')
    .single();

  if (businessError || !business) {
    fail(returnTo, 'Negócio indisponível para agendamento.');
  }

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, business_id, duration_minutes, is_active')
    .eq('id', parsed.data.serviceId)
    .eq('business_id', business.id)
    .eq('is_active', true)
    .single();

  if (serviceError || !service) {
    fail(returnTo, 'Serviço inválido para este studio.');
  }

  const requestedAt = new Date(`${parsed.data.requestedDate}T${parsed.data.requestedTime}:00`);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + Number(business.booking_window_days || 30));

  if (requestedAt.getTime() < Date.now() + Number(business.booking_lead_time_hours || 2) * 60 * 60 * 1000) {
    fail(returnTo, 'Escolha um horário com antecedência mínima configurada pelo studio.');
  }

  if (requestedAt > maxDate) {
    fail(returnTo, 'A data escolhida está fora da janela de agendamento disponível.');
  }

  const [{ data: appointments }, { data: pendingRequests }, { data: businessHours }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, end_time, duration_minutes, status')
      .eq('business_id', business.id)
      .eq('appointment_date', parsed.data.requestedDate),
    supabase
      .from('booking_requests')
      .select('id, requested_date, requested_time, status, services(duration_minutes)')
      .eq('business_id', business.id)
      .eq('requested_date', parsed.data.requestedDate)
      .in('status', ['pending', 'rescheduled']),
    supabase.from('business_hours').select('*').eq('business_id', business.id)
  ]);

  const durationMinutes = Number(service.duration_minutes || 60);
  const endTime = calculateEndTime(parsed.data.requestedTime, durationMinutes);

  if (!isWithinBusinessHours({
    date: parsed.data.requestedDate,
    time: parsed.data.requestedTime,
    durationMinutes,
    hours: businessHours || []
  })) {
    fail(returnTo, 'Esse horário está fora do funcionamento do studio.');
  }

  const busySlots = [
    ...((appointments || []) as AppointmentSlot[]),
    ...bookingRequestsToBusySlots((pendingRequests || []) as RequestBusySlot[])
  ];

  if (appointmentsOverlap({
    date: parsed.data.requestedDate,
    startTime: parsed.data.requestedTime,
    endTime,
    appointments: busySlots
  })) {
    fail(returnTo, 'Esse horário já foi solicitado ou ocupado por outra pessoa. Escolha outro horário.');
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

  if (error) {
    fail(returnTo, error.message || 'Não foi possível enviar a solicitação.');
  }

  success(returnTo);
}
