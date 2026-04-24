'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { serviceSchema } from '@/lib/validations/service';
import { getCurrentBusiness } from '@/lib/auth';

function parseServiceForm(formData: FormData, businessId: string) {
  return serviceSchema.safeParse({
    businessId,
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    durationMinutes: formData.get('durationMinutes'),
    category: formData.get('category'),
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true'
  });
}

export async function createService(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const parsed = parseServiceForm(formData, business.id);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();
  const { error } = await supabase.from('services').insert({
    business_id: business.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: parsed.data.price,
    duration_minutes: parsed.data.durationMinutes,
    category: parsed.data.category || null,
    is_active: parsed.data.isActive
  });

  if (error) throw new Error(error.message);

  revalidatePath('/app/servicos');
  revalidatePath('/app');
}

export async function updateService(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const serviceId = String(formData.get('serviceId') || '');

  if (!serviceId) throw new Error('Serviço inválido.');

  const parsed = parseServiceForm(formData, business.id);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('services')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      duration_minutes: parsed.data.durationMinutes,
      category: parsed.data.category || null,
      is_active: parsed.data.isActive
    })
    .eq('id', serviceId)
    .eq('business_id', business.id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/servicos');
  revalidatePath('/app');
  revalidatePath('/app/agenda');
}

export async function deleteService(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const serviceId = String(formData.get('serviceId') || '');

  if (!serviceId) throw new Error('Serviço inválido.');

  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', serviceId).eq('business_id', business.id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/servicos');
}

export async function toggleServiceVisibility(formData: FormData): Promise<void> {
  const business = await getCurrentBusiness();
  const serviceId = String(formData.get('serviceId') || '');
  const nextValue = String(formData.get('nextValue') || '') === 'true';

  if (!serviceId) throw new Error('Serviço inválido.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('services')
    .update({ is_active: nextValue })
    .eq('id', serviceId)
    .eq('business_id', business.id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/servicos');
  revalidatePath(`/${business.slug}`);
}
