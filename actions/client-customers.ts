'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { customerSchema } from '@/lib/validations/customer';
import { getCurrentBusiness } from '@/lib/auth';
import { redirectWithError, redirectWithSuccess } from '@/lib/redirects';
import { logAuditEvent } from '@/lib/audit';

const CUSTOMERS_PATH = '/app/clientes';

function parseTags(formData: FormData) {
  return formData
    .getAll('tags')
    .map((tag) => String(tag).trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: FormDataEntryValue | null, fallback = 30) {
  const parsed = Number(value || fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCustomerForm(formData: FormData, businessId: string) {
  return customerSchema.safeParse({
    businessId,
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    birthday: formData.get('birthday'),
    notes: formData.get('notes')
  });
}

export async function createCustomer(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const parsed = parseCustomerForm(formData, business.id);

  if (!parsed.success) {
    redirectWithError(CUSTOMERS_PATH, parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .insert({
      business_id: business.id,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      birthday: parsed.data.birthday || null,
      notes: parsed.data.notes || null,
      tags: parseTags(formData),
      next_follow_up_date: String(formData.get('nextFollowUpDate') || '') || null,
      return_interval_days: parseOptionalNumber(formData.get('returnIntervalDays')),
      preferences: String(formData.get('preferences') || '').trim() || null,
      restrictions: String(formData.get('restrictions') || '').trim() || null
    })
    .select('id')
    .single();

  if (error || !data) redirectWithError(CUSTOMERS_PATH, error?.message || 'Não foi possível salvar a cliente.');

  await logAuditEvent({
    businessId: business.id,
    actorId: business.owner_id,
    action: 'customer.created',
    entityType: 'customer',
    entityId: data.id,
    metadata: { fullName: parsed.data.fullName }
  });

  revalidatePath('/app/clientes');
  revalidatePath('/app');
  redirectWithSuccess(CUSTOMERS_PATH, 'Cliente cadastrada com sucesso.');
}

export async function updateCustomer(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const customerId = String(formData.get('customerId') || '');

  if (!customerId) redirectWithError(CUSTOMERS_PATH, 'Cliente inválida.');

  const parsed = parseCustomerForm(formData, business.id);
  if (!parsed.success) {
    redirectWithError(CUSTOMERS_PATH, parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('customers')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      birthday: parsed.data.birthday || null,
      notes: parsed.data.notes || null,
      tags: parseTags(formData),
      next_follow_up_date: String(formData.get('nextFollowUpDate') || '') || null,
      return_interval_days: parseOptionalNumber(formData.get('returnIntervalDays')),
      preferences: String(formData.get('preferences') || '').trim() || null,
      restrictions: String(formData.get('restrictions') || '').trim() || null
    })
    .eq('id', customerId)
    .eq('business_id', business.id);

  if (error) redirectWithError(CUSTOMERS_PATH, error.message);

  await logAuditEvent({
    businessId: business.id,
    actorId: business.owner_id,
    action: 'customer.updated',
    entityType: 'customer',
    entityId: customerId,
    metadata: { fullName: parsed.data.fullName }
  });

  revalidatePath('/app/clientes');
  revalidatePath('/app/agenda');
  redirectWithSuccess(CUSTOMERS_PATH, 'Cliente atualizada com sucesso.');
}

export async function deleteCustomer(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const customerId = String(formData.get('customerId') || '');

  if (!customerId) redirectWithError(CUSTOMERS_PATH, 'Cliente inválida.');

  const supabase = await createClient();
  const { error } = await supabase.from('customers').delete().eq('id', customerId).eq('business_id', business.id);

  if (error) redirectWithError(CUSTOMERS_PATH, error.message);

  await logAuditEvent({
    businessId: business.id,
    actorId: business.owner_id,
    action: 'customer.deleted',
    entityType: 'customer',
    entityId: customerId
  });

  revalidatePath('/app/clientes');
  revalidatePath('/app/agenda');
  redirectWithSuccess(CUSTOMERS_PATH, 'Cliente excluída com sucesso.');
}
