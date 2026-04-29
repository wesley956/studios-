'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { calculateEndTime, appointmentsOverlap, isWithinBusinessHours } from '@/lib/schedule';
import { getCurrentBusiness } from '@/lib/auth';
import { parseMoney } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit';

const SOLICITACOES_PATH = '/app/solicitacoes';
const AGENDA_PATH = '/app/agenda';

function buildRedirectUrl(path: string, key: 'success' | 'error', message: string) {
  return `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(message)}`;
}

function failOnSolicitacoes(message: string): never {
  redirect(buildRedirectUrl(SOLICITACOES_PATH, 'error', message));
}

function successOnSolicitacoes(message: string): never {
  redirect(buildRedirectUrl(SOLICITACOES_PATH, 'success', message));
}

function failOnAgenda(message: string): never {
  redirect(buildRedirectUrl(AGENDA_PATH, 'error', message));
}

function successOnAgenda(message: string): never {
  redirect(buildRedirectUrl(AGENDA_PATH, 'success', message));
}

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

  return {
    supabase,
    appointments: appointments || [],
    businessHours: businessHours || []
  };
}

export async function approveBookingRequest(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const requestId = String(formData.get('requestId') || '');

  if (!requestId) {
    failOnSolicitacoes('Solicitação inválida. Atualize a página e tente novamente.');
  }

  const supabase = await createClient();
  const { data: request, error: requestError } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('id', requestId)
    .eq('business_id', business.id)
    .single();

  if (requestError || !request) {
    failOnSolicitacoes('Solicitação não encontrada. Ela pode ter sido removida ou alterada.');
  }

  if (request.status !== 'pending') {
    failOnSolicitacoes('Essa solicitação já foi analisada. Atualize a página para ver o status atual.');
  }

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, price, duration_minutes')
    .eq('id', request.service_id)
    .eq('business_id', business.id)
    .maybeSingle();

  if (serviceError) {
    failOnSolicitacoes(`Erro ao buscar o serviço da solicitação: ${serviceError.message}`);
  }

  const confirmedDate = String(formData.get('confirmedDate') || request.requested_date);
  const confirmedTime = String(formData.get('confirmedTime') || request.requested_time).slice(0, 5);
  const durationMinutes = Number(service?.duration_minutes || 60);
  const finalPrice = parseMoney(formData.get('finalPrice')) || Number(service?.price || 0);
  const endTime = calculateEndTime(confirmedTime, durationMinutes);

  const { appointments, businessHours } = await getBusinessContext(business.id, confirmedDate);

  if (!isWithinBusinessHours({ date: confirmedDate, time: confirmedTime, durationMinutes, hours: businessHours })) {
    failOnSolicitacoes('O horário escolhido está fora do funcionamento configurado. Escolha outro horário.');
  }

  if (appointmentsOverlap({ date: confirmedDate, startTime: confirmedTime, endTime, appointments })) {
    failOnSolicitacoes('Já existe outro atendimento nesse horário. Escolha outro horário para aprovar esta solicitação.');
  }

  let customerId: string | null = null;

  const { data: existingCustomers, error: existingCustomerError } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', business.id)
    .eq('phone', request.customer_phone)
    .order('created_at', { ascending: true })
    .limit(1);

  if (existingCustomerError) {
    failOnSolicitacoes(`Erro ao verificar cliente existente: ${existingCustomerError.message}`);
  }

  if (existingCustomers?.[0]?.id) {
    customerId = existingCustomers[0].id;
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

    if (customerError || !newCustomer) {
      failOnSolicitacoes(customerError?.message || 'Não foi possível criar a cliente.');
    }

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

  if (appointmentError || !appointment) {
    failOnSolicitacoes(appointmentError?.message || 'Não foi possível criar o agendamento.');
  }

  const { error: updateError } = await supabase
    .from('booking_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      approved_date: confirmedDate,
      approved_time: confirmedTime
    })
    .eq('id', request.id)
    .eq('business_id', business.id);

  if (updateError) {
    await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)
      .eq('business_id', business.id);

    failOnSolicitacoes(`O agendamento foi criado, mas a solicitação não foi atualizada: ${updateError.message}`);
  }

  await logAuditEvent({
    businessId: business.id,
    actorId: business.owner_id,
    action: 'booking_request.approved',
    entityType: 'booking_request',
    entityId: request.id,
    metadata: { appointmentId: appointment.id, date: confirmedDate, time: confirmedTime }
  });

  revalidatePath('/app/solicitacoes');
  revalidatePath('/app/agenda');
  revalidatePath('/app');
  successOnSolicitacoes('Solicitação aprovada e agendamento criado com sucesso.');
}

export async function cancelBookingRequest(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const requestId = String(formData.get('requestId') || '');

  if (!requestId) {
    failOnSolicitacoes('Solicitação inválida. Atualize a página e tente novamente.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('booking_requests')
    .update({
      status: 'cancelled',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .eq('business_id', business.id);

  if (error) {
    failOnSolicitacoes(error.message);
  }

  await logAuditEvent({
    businessId: business.id,
    actorId: business.owner_id,
    action: 'booking_request.cancelled',
    entityType: 'booking_request',
    entityId: requestId
  });

  revalidatePath('/app/solicitacoes');
  revalidatePath('/app');
  successOnSolicitacoes('Solicitação recusada com sucesso.');
}

export async function updateAppointmentStatus(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const appointmentId = String(formData.get('appointmentId') || '');
  const status = String(formData.get('status') || '');

  if (!appointmentId || !['confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
    failOnAgenda('Agendamento inválido. Atualize a página e tente novamente.');
  }

  const supabase = await createClient();
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('*, services(price, duration_minutes)')
    .eq('id', appointmentId)
    .eq('business_id', business.id)
    .single();

  if (appointmentError || !appointment) {
    failOnAgenda('Agendamento não encontrado. Ele pode ter sido removido ou alterado.');
  }

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from('payments')
    .select('id, paid_at')
    .eq('appointment_id', appointment.id)
    .maybeSingle();

  if (existingPaymentError) {
    failOnAgenda(`Erro ao verificar pagamento existente: ${existingPaymentError.message}`);
  }

  const nextDate = String(formData.get('appointmentDate') || appointment.appointment_date);
  const nextTime = String(formData.get('appointmentTime') || appointment.appointment_time).slice(0, 5);
  const durationMinutes = Number(appointment.duration_minutes || appointment.services?.duration_minutes || 60);
  const endTime = calculateEndTime(nextTime, durationMinutes);

  const basePrice = Number(appointment.services?.price || appointment.final_price || 0);
  const finalPriceField = String(formData.get('finalPrice') || '').trim();
  const paidAmountField = String(formData.get('paidAmount') || '').trim();

  const finalPrice = finalPriceField !== ''
    ? parseMoney(finalPriceField)
    : Number(appointment.final_price || basePrice);

  const paidAmount = paidAmountField !== ''
    ? parseMoney(paidAmountField)
    : status === 'completed'
      ? finalPrice
      : Number(appointment.paid_amount || 0);

  const paymentMethod = String(formData.get('paymentMethod') || appointment.payment_method || '').trim() || null;
  const cancellationReason = String(formData.get('cancellationReason') || appointment.cancellation_reason || '').trim() || null;
  const notes = String(formData.get('notes') || appointment.notes || '').trim() || null;

  if (status === 'confirmed') {
    const { appointments, businessHours } = await getBusinessContext(business.id, nextDate);

    if (!isWithinBusinessHours({ date: nextDate, time: nextTime, durationMinutes, hours: businessHours })) {
      failOnAgenda('O horário informado está fora do funcionamento. Escolha outro horário.');
    }

    if (
      appointmentsOverlap({
        date: nextDate,
        startTime: nextTime,
        endTime,
        appointments,
        ignoreAppointmentId: appointment.id
      })
    ) {
      failOnAgenda('Já existe um agendamento nesse horário. Escolha outro horário.');
    }
  }

  const paymentStatus =
    status === 'cancelled' || status === 'no_show'
      ? 'cancelled'
      : paidAmount >= finalPrice && finalPrice > 0
        ? 'paid'
        : paidAmount > 0
          ? 'partial'
          : 'pending';

  const completedAt = status === 'completed'
    ? appointment.completed_at || new Date().toISOString()
    : null;

  const updatePayload = {
    appointment_date: nextDate,
    appointment_time: nextTime,
    end_time: endTime,
    status,
    final_price: finalPrice,
    paid_amount: paidAmount,
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    completed_at: completedAt,
    cancellation_reason: status === 'cancelled' || status === 'no_show' ? cancellationReason : null,
    notes
  };

  const { error } = await supabase
    .from('appointments')
    .update(updatePayload)
    .eq('id', appointment.id)
    .eq('business_id', business.id);

  if (error) {
    failOnAgenda(error.message);
  }

  const shouldSyncPayment = status === 'completed' || paidAmount > 0 || Boolean(existingPayment?.id);

  if (shouldSyncPayment) {
    const paymentPayload = {
      business_id: business.id,
      appointment_id: appointment.id,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      amount: paidAmount,
      discount_amount: Math.max(basePrice - finalPrice, 0),
      additional_amount: Math.max(finalPrice - basePrice, 0),
      final_amount: finalPrice,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      paid_at: paidAmount > 0 ? existingPayment?.paid_at || completedAt || new Date().toISOString() : null,
      notes
    };

    if (existingPayment?.id) {
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update(paymentPayload)
        .eq('id', existingPayment.id);

      if (paymentUpdateError) {
        failOnAgenda(paymentUpdateError.message);
      }
    } else {
      const { error: paymentInsertError } = await supabase.from('payments').insert(paymentPayload);

      if (paymentInsertError) {
        failOnAgenda(paymentInsertError.message);
      }
    }
  }

  if (status === 'completed' && appointment.customer_id) {
    const completedBase = new Date(`${nextDate}T00:00:00`);
    const nextFollowUp = new Date(completedBase);
    nextFollowUp.setDate(completedBase.getDate() + 30);

    await supabase
      .from('customers')
      .update({
        next_follow_up_date: nextFollowUp.toISOString().slice(0, 10),
        last_contacted_at: new Date().toISOString()
      })
      .eq('id', appointment.customer_id)
      .eq('business_id', business.id);
  }

  await logAuditEvent({
    businessId: business.id,
    actorId: business.owner_id,
    action: 'appointment.updated',
    entityType: 'appointment',
    entityId: appointment.id,
    metadata: { status, date: nextDate, time: nextTime, paymentStatus }
  });

  revalidatePath('/app/agenda');
  revalidatePath('/app');
  revalidatePath('/app/financeiro');
  revalidatePath('/app/clientes');
  successOnAgenda('Agendamento atualizado com sucesso.');
}
