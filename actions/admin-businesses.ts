'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessSchema } from '@/lib/validations/business';
import { slugify } from '@/lib/utils';

function normalizeString(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

export async function createBusiness(formData: FormData): Promise<void> {
  const ownerId = normalizeString(formData.get('ownerId'));
  const ownerName = normalizeString(formData.get('ownerName'));
  const ownerEmail = normalizeString(formData.get('ownerEmail'));
  const ownerPassword = normalizeString(formData.get('ownerPassword'));

  const parsed = businessSchema.safeParse({
    ownerId: ownerId || '00000000-0000-0000-0000-000000000000',
    businessName: formData.get('businessName'),
    slug: slugify(normalizeString(formData.get('slug') || formData.get('businessName'))),
    city: formData.get('city'),
    whatsapp: formData.get('whatsapp'),
    instagram: formData.get('instagram'),
    address: formData.get('address'),
    description: formData.get('description'),
    planName: formData.get('planName') || 'start',
    status: formData.get('status') || 'trial'
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  let finalOwnerId = ownerId;
  let createdAuthUserId: string | null = null;

  try {
    if (!finalOwnerId) {
      if (!ownerEmail || !ownerPassword || !ownerName) {
        throw new Error('Para criar uma nova dona, informe nome, e-mail e senha.');
      }

      const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName
        }
      });

      if (authError || !createdUser.user) {
        throw new Error(authError?.message || 'Não foi possível criar o acesso da cliente.');
      }

      finalOwnerId = createdUser.user.id;
      createdAuthUserId = createdUser.user.id;

      const { error: profileError } = await admin.from('profiles').insert({
        id: finalOwnerId,
        email: ownerEmail,
        full_name: ownerName,
        role: 'client_owner'
      });

      if (profileError) {
        throw new Error(profileError.message);
      }
    }

    const { error } = await supabase.from('businesses').insert({
      owner_id: finalOwnerId,
      business_name: parsed.data.businessName,
      slug: parsed.data.slug,
      city: parsed.data.city || null,
      whatsapp: parsed.data.whatsapp || null,
      instagram: parsed.data.instagram || null,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
      tagline: normalizeString(formData.get('tagline')) || null,
      plan_name: parsed.data.planName,
      status: parsed.data.status
    });

    if (error) throw new Error(error.message);
  } catch (error) {
    if (createdAuthUserId) {
      await admin.auth.admin.deleteUser(createdAuthUserId);
    }
    throw error;
  }

  revalidatePath('/admin');
  revalidatePath('/admin/clientes');
}

export async function updateBusinessAdmin(formData: FormData): Promise<void> {
  const businessId = normalizeString(formData.get('businessId'));
  if (!businessId) throw new Error('Cliente inválido.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('businesses')
    .update({
      status: normalizeString(formData.get('status')) || 'trial',
      plan_name: normalizeString(formData.get('planName')) || 'start',
      business_name: normalizeString(formData.get('businessName')) || undefined,
      city: normalizeString(formData.get('city')) || null,
      whatsapp: normalizeString(formData.get('whatsapp')) || null,
      instagram: normalizeString(formData.get('instagram')) || null,
      address: normalizeString(formData.get('address')) || null,
      tagline: normalizeString(formData.get('tagline')) || null,
      description: normalizeString(formData.get('description')) || null,
      slug: slugify(normalizeString(formData.get('slug')))
    })
    .eq('id', businessId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/admin/clientes');
  revalidatePath(`/admin/clientes/${businessId}`);
}
