'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { calculateEndTime, appointmentsOverlap, isWithinBusinessHours } from '@/lib/schedule';
import { getCurrentBusiness } from '@/lib/auth';
import { parseMoney } from '@/lib/utils';

async function getBusinessContext(businessId: string, date: string) {
  const supabase = await createClient();
  const [{ data: appointments }, { data: businessHours }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, end_time, duration_minutes, status')
      .eq('business_id', businessId)
      .eq('appointment_date', date),
    supabase.from('business_hours').select('*').eq('business_id', businessId)
  ]);

  return { supabase, appointments: appointments || [], businessHours: businessHours || [] };
}

export async function approveBookingRequest(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const requestId = String(formData.get('requestId') || '');
  if (!requestId) throw new Error('Solicitação inválida.');

  const supabase = await createClient();
  const { data: request, error: requestError } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('id', requestId)
    .eq('business_id', business.id)
    .single();

  if (requestError || !request) throw new Error('Solicitação não encontrada.');

  const { data: service } = await supabase
    .from('services')
    .select('id, price, duration_minutes')
    .eq('id', request.service_id)
    .eq('business_id', business.id)
    .maybeSingle();

  const confirmedDate = String(formData.get('confirmedDate') || request.requested_date);
  const confirmedTime = String(formData.get('confirmedTime') || request.requested_time).slice(0, 5);
  const durationMinutes = Number(service?.duration_minutes || 60);
  const finalPrice = parseMoney(formData.get('finalPrice')) || Number(service?.price || 0);
  const endTime = calculateEndTime(confirmedTime, durationMinutes);

  const { appointments, businessHours } = await getBusinessContext(business.id, confirmedDate);

  if (!isWithinBusinessHours({ date: confirmedDate, time: confirmedTime, durationMinutes, hours: businessHours })) {
    throw new Error('O horário escolhido está fora do funcionamento configurado.');
  }

  if (appointmentsOverlap({ date: confirmedDate, startTime: confirmedTime, endTime, appointments })) {
    throw new Error('Já existe outro atendimento nesse horário. Escolha outro horário para aprovar.');
  }

  let customerId: string | null = null;
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', business.id)
    .eq('phone', request.customer_phone)
    .maybeSingle();

  if (existingCustomer?.id) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        business_id: business.id,
        full_name: request.customer_name,
        phone: request.customer_phone
      })
      .select('id')
      .single();

    if (customerError || !newCustomer) throw new Error('Não foi possível criar a cliente.');
    customerId = newCustomer.id;
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      business_id: business.id,
      customer_id: customerId,
      booking_request_id: request.id,
      service_id: request.service_id,
      appointment_date: confirmedDate,
      appointment_time: confirmedTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      final_price: finalPrice,
      paid_amount: 0,
      payment_status: 'pending',
      status: 'confirmed',
      notes: request.notes || null
    })
    .select('id')
    .single();

  if (appointmentError || !appointment) throw new Error(appointmentError?.message || 'Não foi possível criar o agendamento.');

  const { error: updateError } = await supabase
    .from('booking_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      approved_date: confirmedDate,
      approved_time: confirmedTime
    })
    .eq('id', request.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/app/solicitacoes');
  revalidatePath('/app/agenda');
  revalidatePath('/app');
}

export async function cancelBookingRequest(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const requestId = String(formData.get('requestId') || '');
  if (!requestId) throw new Error('Solicitação inválida.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('booking_requests')
    .update({ status: 'cancelled', reviewed_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('business_id', business.id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/solicitacoes');
  revalidatePath('/app');
}

export async function updateAppointmentStatus(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const appointmentId = String(formData.get('appointmentId') || '');
  const status = String(formData.get('status') || '');

  if (!appointmentId || !['confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
    throw new Error('Agendamento inválido.');
  }

  const supabase = await createClient();
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('*, services(price, duration_minutes)')
    .eq('id', appointmentId)
    .eq('business_id', business.id)
    .single();

  if (appointmentError || !appointment) throw new Error('Agendamento não encontrado.');

  const nextDate = String(formData.get('appointmentDate') || appointment.appointment_date);
  const nextTime = String(formData.get('appointmentTime') || appointment.appointment_time).slice(0, 5);
  const durationMinutes = Number(appointment.duration_minutes || appointment.services?.duration_minutes || 60);
  const endTime = calculateEndTime(nextTime, durationMinutes);
  const finalPrice = parseMoney(formData.get('finalPrice')) || Number(appointment.final_price || appointment.services?.price || 0);
  const paidAmount = parseMoney(formData.get('paidAmount')) || (status === 'completed' ? finalPrice : Number(appointment.paid_amount || 0));
  const paymentMethod = String(formData.get('paymentMethod') || appointment.payment_method || '') || null;
  const cancellationReason = String(formData.get('cancellationReason') || appointment.cancellation_reason || '') || null;
  const notes = String(formData.get('notes') || appointment.notes || '') || null;

  if (status === 'confirmed') {
    const { appointments, businessHours } = await getBusinessContext(business.id, nextDate);
    if (!isWithinBusinessHours({ date: nextDate, time: nextTime, durationMinutes, hours: businessHours })) {
      throw new Error('O horário informado está fora do funcionamento.');
    }

    if (appointmentsOverlap({ date: nextDate, startTime: nextTime, endTime, appointments, ignoreAppointmentId: appointment.id })) {
      throw new Error('Já existe um agendamento nesse horário.');
    }
  }

  const paymentStatus = status === 'completed'
    ? paidAmount >= finalPrice
      ? 'paid'
      : paidAmount > 0
        ? 'partial'
        : 'pending'
    : status === 'cancelled'
      ? 'cancelled'
      : appointment.payment_status;

  const updatePayload = {
    appointment_date: nextDate,
    appointment_time: nextTime,
    end_time: endTime,
    status,
    final_price: finalPrice,
    paid_amount: paidAmount,
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    completed_at: status === 'completed' ? new Date().toISOString() : appointment.completed_at,
    cancellation_reason: status === 'cancelled' || status === 'no_show' ? cancellationReason : null,
    notes
  };

  const { error } = await supabase
    .from('appointments')
    .update(updatePayload)
    .eq('id', appointment.id)
    .eq('business_id', business.id);

  if (error) throw new Error(error.message);

  if (status === 'completed') {
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('appointment_id', appointment.id)
      .maybeSingle();

    const paymentPayload = {
      business_id: business.id,
      appointment_id: appointment.id,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      amount: Number(appointment.services?.price || finalPrice),
      discount_amount: Math.max(Number(appointment.services?.price || finalPrice) - finalPrice, 0),
      additional_amount: Math.max(finalPrice - Number(appointment.services?.price || finalPrice), 0),
      final_amount: finalPrice,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
      notes
    };

    if (existingPayment?.id) {
      const { error: paymentUpdateError } = await supabase.from('payments').update(paymentPayload).eq('id', existingPayment.id);
      if (paymentUpdateError) throw new Error(paymentUpdateError.message);
    } else {
      const { error: paymentInsertError } = await supabase.from('payments').insert(paymentPayload);
      if (paymentInsertError) throw new Error(paymentInsertError.message);
    }
  }

  revalidatePath('/app/agenda');
  revalidatePath('/app');
  revalidatePath('/app/financeiro');
}
