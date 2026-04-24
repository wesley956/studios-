'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { customerSchema } from '@/lib/validations/customer';
import { getCurrentBusiness } from '@/lib/auth';

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
    throw new Error(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('customers').insert({
    business_id: business.id,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    birthday: parsed.data.birthday || null,
    notes: parsed.data.notes || null
  });

  if (error) throw new Error(error.message);

  revalidatePath('/app/clientes');
  revalidatePath('/app');
}

export async function updateCustomer(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const customerId = String(formData.get('customerId') || '');

  if (!customerId) throw new Error('Cliente inválida.');

  const parsed = parseCustomerForm(formData, business.id);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('customers')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      birthday: parsed.data.birthday || null,
      notes: parsed.data.notes || null
    })
    .eq('id', customerId)
    .eq('business_id', business.id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/clientes');
  revalidatePath('/app/agenda');
}

export async function deleteCustomer(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const customerId = String(formData.get('customerId') || '');

  if (!customerId) throw new Error('Cliente inválida.');

  const supabase = await createClient();
  const { error } = await supabase.from('customers').delete().eq('id', customerId).eq('business_id', business.id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/clientes');
  revalidatePath('/app/agenda');
}
