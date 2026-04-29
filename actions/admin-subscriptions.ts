'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { SINGLE_PLAN_PRICE } from '@/lib/validations/business';

const VALID_STATUSES = new Set(['paid', 'pending', 'overdue', 'waived']);
const VALID_PAYMENT_METHODS = new Set(['', 'pix', 'cash', 'credit_card', 'debit_card', 'transfer']);

type ActionOutcome = {
  returnTo: string;
  type: 'error' | 'success';
  message: string;
};

function normalizeString(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function parseMoney(value: FormDataEntryValue | null, fallback = 0) {
  const raw = normalizeString(value);
  if (!raw) return fallback;

  const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseIntSafe(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(normalizeString(value));
  return Number.isInteger(parsed) ? parsed : fallback;
}

function getCurrentReference() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

function getDefaultDueDate(referenceMonth: number, referenceYear: number) {
  return `${referenceYear}-${String(referenceMonth).padStart(2, '0')}-10`;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function isValidReference(referenceMonth: number, referenceYear: number) {
  return referenceMonth >= 1 && referenceMonth <= 12 && referenceYear >= 2024 && referenceYear <= 2100;
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function normalizeStatus(requestedStatus: string, dueDate: string) {
  if (requestedStatus === 'paid' || requestedStatus === 'waived') return requestedStatus;
  if (requestedStatus === 'overdue') return 'overdue';
  if (dueDate < todayDateString()) return 'overdue';
  return 'pending';
}

function normalizePaymentMethod(value: string) {
  return VALID_PAYMENT_METHODS.has(value) ? value || null : null;
}

function normalizePaidAt(value: string, status: string) {
  if (status !== 'paid') return null;

  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function getReturnTo(formData: FormData, fallback: string) {
  const value = normalizeString(formData.get('returnTo'));

  if (value.startsWith('/admin')) {
    return value;
  }

  return fallback;
}

function redirectWithMessage(returnTo: string, type: 'error' | 'success', message: string): never {
  const separator = returnTo.includes('?') ? '&' : '?';
  redirect(`${returnTo}${separator}${type}=${encodeURIComponent(message)}`);
}

function getUnexpectedErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return 'Erro inesperado ao processar a cobrança.';
}

function revalidateAdminPaths(businessId?: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/clientes');
  revalidatePath('/admin/financeiro');
  revalidatePath('/admin/uso');

  if (businessId) {
    revalidatePath(`/admin/clientes/${businessId}`);
  }
}

function getBusinessFallback(businessId: string) {
  return businessId ? `/admin/clientes/${businessId}` : '/admin/financeiro';
}

export async function ensureCurrentMonthSubscription(formData: FormData): Promise<void> {
  await requireAdmin();

  const businessId = normalizeString(formData.get('businessId'));
  const returnTo = getReturnTo(formData, getBusinessFallback(businessId));

  if (!businessId) {
    redirectWithMessage(returnTo, 'error', 'Cliente inválido.');
  }

  const { month, year } = getCurrentReference();
  const dueDate = normalizeString(formData.get('dueDate')) || getDefaultDueDate(month, year);

  if (!isValidDateString(dueDate)) {
    redirectWithMessage(returnTo, 'error', 'Informe uma data de vencimento válida.');
  }

  const admin = createAdminClient();

  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .maybeSingle();

  if (businessError) {
    redirectWithMessage(returnTo, 'error', `Erro ao verificar cliente: ${businessError.message}`);
  }

  if (!business) {
    redirectWithMessage(returnTo, 'error', 'Cliente não encontrado.');
  }

  const { data: existing, error: existingError } = await admin
    .from('platform_subscriptions')
    .select('id')
    .eq('business_id', businessId)
    .eq('reference_month', month)
    .eq('reference_year', year)
    .maybeSingle();

  if (existingError) {
    redirectWithMessage(returnTo, 'error', `Erro ao verificar cobrança existente: ${existingError.message}`);
  }

  if (existing?.id) {
    revalidateAdminPaths(businessId);
    redirectWithMessage(returnTo, 'success', 'A cobrança deste mês já estava criada.');
  }

  const { error } = await admin.from('platform_subscriptions').insert({
    business_id: businessId,
    reference_month: month,
    reference_year: year,
    amount: Number(SINGLE_PLAN_PRICE.toFixed(2)),
    status: normalizeStatus('pending', dueDate),
    due_date: dueDate,
    notes: normalizeString(formData.get('notes')) || null,
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirectWithMessage(returnTo, 'error', `Erro ao criar cobrança do mês: ${error.message}`);
  }

  revalidateAdminPaths(businessId);
  redirectWithMessage(returnTo, 'success', 'Cobrança do mês criada com sucesso.');
}

async function buildCreateSubscriptionRecordOutcome(formData: FormData): Promise<ActionOutcome> {
  const businessId = normalizeString(formData.get('businessId'));
  const returnTo = getReturnTo(formData, getBusinessFallback(businessId));

  try {
    if (!businessId) {
      return {
        returnTo,
        type: 'error',
        message: 'Cliente inválido.'
      };
    }

    const { month, year } = getCurrentReference();
    const referenceMonth = parseIntSafe(formData.get('referenceMonth'), month);
    const referenceYear = parseIntSafe(formData.get('referenceYear'), year);
    const amount = parseMoney(formData.get('amount'), SINGLE_PLAN_PRICE);

    const defaultCurrentDueDate = getDefaultDueDate(month, year);
    const dueDateRaw = normalizeString(formData.get('dueDate'));
    const dueDate =
      !dueDateRaw || dueDateRaw === defaultCurrentDueDate
        ? getDefaultDueDate(referenceMonth, referenceYear)
        : dueDateRaw;

    const requestedStatus = normalizeString(formData.get('status')) || 'pending';
    const status = VALID_STATUSES.has(requestedStatus)
      ? normalizeStatus(requestedStatus, dueDate)
      : normalizeStatus('pending', dueDate);
    const paymentMethod = normalizePaymentMethod(normalizeString(formData.get('paymentMethod')));
    const notes = normalizeString(formData.get('notes')) || null;
    const paidAt = normalizePaidAt(normalizeString(formData.get('paidAt')), status);

    if (!isValidReference(referenceMonth, referenceYear)) {
      return {
        returnTo,
        type: 'error',
        message: 'Informe um mês e um ano válidos para a cobrança.'
      };
    }

    if (!isValidDateString(dueDate)) {
      return {
        returnTo,
        type: 'error',
        message: 'Informe uma data de vencimento válida.'
      };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        returnTo,
        type: 'error',
        message: 'Informe um valor de cobrança válido.'
      };
    }

    const admin = createAdminClient();

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) {
      return {
        returnTo,
        type: 'error',
        message: `Erro ao verificar cliente: ${businessError.message}`
      };
    }

    if (!business) {
      return {
        returnTo,
        type: 'error',
        message: 'Cliente não encontrado.'
      };
    }

    const subscriptionPayload = {
      business_id: businessId,
      reference_month: referenceMonth,
      reference_year: referenceYear,
      amount,
      status,
      due_date: dueDate,
      paid_at: paidAt,
      payment_method: paymentMethod,
      notes,
      updated_at: new Date().toISOString()
    };

    const { data: existingSubscriptions, error: existingError } = await admin
      .from('platform_subscriptions')
      .select('id')
      .eq('business_id', businessId)
      .eq('reference_month', referenceMonth)
      .eq('reference_year', referenceYear)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (existingError) {
      return {
        returnTo,
        type: 'error',
        message: `Erro ao verificar cobrança existente: ${existingError.message}`
      };
    }

    const existingId = existingSubscriptions?.[0]?.id;

    if (existingId) {
      const { error: updateError } = await admin
        .from('platform_subscriptions')
        .update(subscriptionPayload)
        .eq('id', existingId);

      if (updateError) {
        return {
          returnTo,
          type: 'error',
          message: `Erro ao atualizar cobrança existente: ${updateError.message}`
        };
      }

      revalidateAdminPaths(businessId);

      return {
        returnTo,
        type: 'success',
        message: 'A cobrança já existia para esse mês e foi atualizada.'
      };
    }

    const { error: insertError } = await admin.from('platform_subscriptions').insert(subscriptionPayload);

    if (insertError) {
      if (insertError.code === '23505') {
        const { error: retryUpdateError } = await admin
          .from('platform_subscriptions')
          .update(subscriptionPayload)
          .eq('business_id', businessId)
          .eq('reference_month', referenceMonth)
          .eq('reference_year', referenceYear);

        if (!retryUpdateError) {
          revalidateAdminPaths(businessId);

          return {
            returnTo,
            type: 'success',
            message: 'A cobrança já existia para esse mês e foi atualizada.'
          };
        }

        return {
          returnTo,
          type: 'error',
          message: `A cobrança já existia, mas não foi possível atualizá-la: ${retryUpdateError.message}`
        };
      }

      return {
        returnTo,
        type: 'error',
        message: `Erro ao salvar cobrança manual: ${insertError.message}`
      };
    }

    revalidateAdminPaths(businessId);

    return {
      returnTo,
      type: 'success',
      message: 'Cobrança manual criada com sucesso.'
    };
  } catch (error) {
    return {
      returnTo,
      type: 'error',
      message: `Erro inesperado ao criar cobrança manual: ${getUnexpectedErrorMessage(error)}`
    };
  }
}

export async function createSubscriptionRecord(formData: FormData): Promise<void> {
  await requireAdmin();

  const outcome = await buildCreateSubscriptionRecordOutcome(formData);
  redirectWithMessage(outcome.returnTo, outcome.type, outcome.message);
}

export async function updateSubscriptionRecord(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));
  const returnTo = getReturnTo(formData, getBusinessFallback(businessId));

  if (!subscriptionId || !businessId) {
    redirectWithMessage(returnTo, 'error', 'Cobrança inválida.');
  }

  const { month, year } = getCurrentReference();
  const referenceMonth = parseIntSafe(formData.get('referenceMonth'), month);
  const referenceYear = parseIntSafe(formData.get('referenceYear'), year);
  const amount = parseMoney(formData.get('amount'), SINGLE_PLAN_PRICE);
  const dueDate = normalizeString(formData.get('dueDate')) || getDefaultDueDate(referenceMonth, referenceYear);
  const requestedStatus = normalizeString(formData.get('status')) || 'pending';
  const status = VALID_STATUSES.has(requestedStatus)
    ? normalizeStatus(requestedStatus, dueDate)
    : normalizeStatus('pending', dueDate);
  const paymentMethod = normalizePaymentMethod(normalizeString(formData.get('paymentMethod')));
  const notes = normalizeString(formData.get('notes')) || null;
  const paidAt = normalizePaidAt(normalizeString(formData.get('paidAt')), status);

  if (!isValidReference(referenceMonth, referenceYear)) {
    redirectWithMessage(returnTo, 'error', 'Informe um mês e um ano válidos para a cobrança.');
  }

  if (!isValidDateString(dueDate)) {
    redirectWithMessage(returnTo, 'error', 'Informe uma data de vencimento válida.');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    redirectWithMessage(returnTo, 'error', 'Informe um valor de cobrança válido.');
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('platform_subscriptions')
    .update({
      reference_month: referenceMonth,
      reference_year: referenceYear,
      amount,
      status,
      due_date: dueDate,
      paid_at: paidAt,
      payment_method: paymentMethod,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .eq('business_id', businessId);

  if (error) {
    redirectWithMessage(returnTo, 'error', `Erro ao atualizar cobrança: ${error.message}`);
  }

  revalidateAdminPaths(businessId);
  redirectWithMessage(returnTo, 'success', 'Cobrança atualizada com sucesso.');
}

export async function confirmSubscriptionPayment(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));
  const returnTo = getReturnTo(formData, getBusinessFallback(businessId));

  if (!subscriptionId || !businessId) {
    redirectWithMessage(returnTo, 'error', 'Cobrança inválida.');
  }

  const amount = parseMoney(formData.get('amount'), SINGLE_PLAN_PRICE);
  const paymentMethod = normalizePaymentMethod(normalizeString(formData.get('paymentMethod')) || 'pix');
  const paidAt = normalizePaidAt(normalizeString(formData.get('paidAt')), 'paid');

  if (!Number.isFinite(amount) || amount <= 0) {
    redirectWithMessage(returnTo, 'error', 'Informe um valor de cobrança válido.');
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('platform_subscriptions')
    .update({
      amount,
      status: 'paid',
      paid_at: paidAt,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .eq('business_id', businessId);

  if (error) {
    redirectWithMessage(returnTo, 'error', `Erro ao confirmar pagamento: ${error.message}`);
  }

  revalidateAdminPaths(businessId);
  redirectWithMessage(returnTo, 'success', 'Pagamento confirmado com sucesso.');
}

export async function markSubscriptionPending(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));
  const dueDate = normalizeString(formData.get('dueDate')) || todayDateString();
  const returnTo = getReturnTo(formData, getBusinessFallback(businessId));

  if (!subscriptionId || !businessId) {
    redirectWithMessage(returnTo, 'error', 'Cobrança inválida.');
  }

  if (!isValidDateString(dueDate)) {
    redirectWithMessage(returnTo, 'error', 'Informe uma data de vencimento válida.');
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('platform_subscriptions')
    .update({
      status: normalizeStatus('pending', dueDate),
      paid_at: null,
      payment_method: null,
      due_date: dueDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .eq('business_id', businessId);

  if (error) {
    redirectWithMessage(returnTo, 'error', `Erro ao voltar cobrança para pendente: ${error.message}`);
  }

  revalidateAdminPaths(businessId);
  redirectWithMessage(returnTo, 'success', 'Cobrança voltou para pendente.');
}

export async function deleteSubscriptionRecord(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));
  const returnTo = getReturnTo(formData, getBusinessFallback(businessId));

  if (!subscriptionId || !businessId) {
    redirectWithMessage(returnTo, 'error', 'Cobrança inválida.');
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('platform_subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('business_id', businessId);

  if (error) {
    redirectWithMessage(returnTo, 'error', `Erro ao excluir cobrança: ${error.message}`);
  }

  revalidateAdminPaths(businessId);
  redirectWithMessage(returnTo, 'success', 'Cobrança excluída com sucesso.');
}
