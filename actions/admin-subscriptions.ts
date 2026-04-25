'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SINGLE_PLAN_PRICE } from '@/lib/validations/business';

const VALID_STATUSES = new Set(['paid', 'pending', 'overdue', 'waived']);
const VALID_PAYMENT_METHODS = new Set(['', 'pix', 'cash', 'credit_card', 'debit_card', 'transfer']);

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
  return Number.isFinite(parsed) ? parsed : fallback;
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

function normalizeStatus(requestedStatus: string, dueDate: string) {
  if (requestedStatus === 'paid' || requestedStatus === 'waived') return requestedStatus;
  if (dueDate < todayDateString()) return 'overdue';
  return 'pending';
}

function normalizePaymentMethod(value: string) {
  return VALID_PAYMENT_METHODS.has(value) ? value || null : null;
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

export async function ensureCurrentMonthSubscription(formData: FormData): Promise<void> {
  await requireAdmin();

  const businessId = normalizeString(formData.get('businessId'));
  if (!businessId) {
    throw new Error('Cliente inválido.');
  }

  const { month, year } = getCurrentReference();
  const dueDate = normalizeString(formData.get('dueDate')) || getDefaultDueDate(month, year);

  const supabase = await createClient();

  const payload = {
    business_id: businessId,
    reference_month: month,
    reference_year: year,
    amount: Number(SINGLE_PLAN_PRICE.toFixed(2)),
    status: normalizeStatus('pending', dueDate),
    due_date: dueDate,
    notes: normalizeString(formData.get('notes')) || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('platform_subscriptions')
    .upsert(payload, { onConflict: 'business_id,reference_month,reference_year' });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdminPaths(businessId);
}

export async function createSubscriptionRecord(formData: FormData): Promise<void> {
  await requireAdmin();

  const businessId = normalizeString(formData.get('businessId'));
  if (!businessId) {
    throw new Error('Cliente inválido.');
  }

  const referenceMonth = parseIntSafe(formData.get('referenceMonth'), getCurrentReference().month);
  const referenceYear = parseIntSafe(formData.get('referenceYear'), getCurrentReference().year);
  const amount = parseMoney(formData.get('amount'), SINGLE_PLAN_PRICE);
  const dueDate = normalizeString(formData.get('dueDate')) || getDefaultDueDate(referenceMonth, referenceYear);
  const requestedStatus = normalizeString(formData.get('status')) || 'pending';
  const status = VALID_STATUSES.has(requestedStatus) ? normalizeStatus(requestedStatus, dueDate) : normalizeStatus('pending', dueDate);
  const paymentMethod = normalizePaymentMethod(normalizeString(formData.get('paymentMethod')));
  const notes = normalizeString(formData.get('notes')) || null;

  const paidAt =
    status === 'paid'
      ? normalizeString(formData.get('paidAt')) || new Date().toISOString()
      : null;

  const supabase = await createClient();

  const { error } = await supabase.from('platform_subscriptions').insert({
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
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdminPaths(businessId);
}

export async function updateSubscriptionRecord(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));

  if (!subscriptionId || !businessId) {
    throw new Error('Cobrança inválida.');
  }

  const referenceMonth = parseIntSafe(formData.get('referenceMonth'), getCurrentReference().month);
  const referenceYear = parseIntSafe(formData.get('referenceYear'), getCurrentReference().year);
  const amount = parseMoney(formData.get('amount'), SINGLE_PLAN_PRICE);
  const dueDate = normalizeString(formData.get('dueDate')) || getDefaultDueDate(referenceMonth, referenceYear);
  const requestedStatus = normalizeString(formData.get('status')) || 'pending';
  const status = VALID_STATUSES.has(requestedStatus) ? normalizeStatus(requestedStatus, dueDate) : normalizeStatus('pending', dueDate);
  const paymentMethod = normalizePaymentMethod(normalizeString(formData.get('paymentMethod')));
  const notes = normalizeString(formData.get('notes')) || null;

  const paidAt =
    status === 'paid'
      ? normalizeString(formData.get('paidAt')) || new Date().toISOString()
      : null;

  const supabase = await createClient();

  const { error } = await supabase
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
    throw new Error(error.message);
  }

  revalidateAdminPaths(businessId);
}

export async function confirmSubscriptionPayment(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));

  if (!subscriptionId || !businessId) {
    throw new Error('Cobrança inválida.');
  }

  const amount = parseMoney(formData.get('amount'), SINGLE_PLAN_PRICE);
  const paymentMethod = normalizePaymentMethod(normalizeString(formData.get('paymentMethod')) || 'pix');
  const paidAt = normalizeString(formData.get('paidAt')) || new Date().toISOString();

  const supabase = await createClient();

  const { error } = await supabase
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
    throw new Error(error.message);
  }

  revalidateAdminPaths(businessId);
}

export async function markSubscriptionPending(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));
  const dueDate = normalizeString(formData.get('dueDate')) || todayDateString();

  if (!subscriptionId || !businessId) {
    throw new Error('Cobrança inválida.');
  }

  const supabase = await createClient();

  const { error } = await supabase
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
    throw new Error(error.message);
  }

  revalidateAdminPaths(businessId);
}

export async function deleteSubscriptionRecord(formData: FormData): Promise<void> {
  await requireAdmin();

  const subscriptionId = normalizeString(formData.get('subscriptionId'));
  const businessId = normalizeString(formData.get('businessId'));

  if (!subscriptionId || !businessId) {
    throw new Error('Cobrança inválida.');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('platform_subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('business_id', businessId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdminPaths(businessId);
}
