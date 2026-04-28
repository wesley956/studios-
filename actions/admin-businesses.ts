'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessSchema, SINGLE_PLAN_KEY, SINGLE_PLAN_PRICE } from '@/lib/validations/business';
import { getSuggestedThemeByBusinessType } from '@/lib/themes';
import { slugify } from '@/lib/utils';

function normalizeString(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeString(value).toLowerCase();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erro inesperado ao processar a solicitação.';
}

function redirectWithCreateError(message: string): never {
  redirect(`/admin/clientes/novo?error=${encodeURIComponent(message)}`);
}

function redirectWithUpdateError(businessId: string, message: string): never {
  redirect(`/admin/clientes/${businessId}?error=${encodeURIComponent(message)}`);
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

function revalidateAdminBusinessPaths(businessId?: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/clientes');
  revalidatePath('/admin/financeiro');
  revalidatePath('/admin/uso');

  if (businessId) {
    revalidatePath(`/admin/clientes/${businessId}`);
  }
}

export async function createBusiness(formData: FormData): Promise<void> {
  await requireAdmin();

  const ownerId = normalizeString(formData.get('ownerId'));
  const ownerName = normalizeString(formData.get('ownerName'));
  const ownerEmail = normalizeEmail(formData.get('ownerEmail'));
  const ownerPassword = normalizeString(formData.get('ownerPassword'));
  const rawBusinessName = normalizeString(formData.get('businessName'));
  const rawSlug = normalizeString(formData.get('slug')) || rawBusinessName;
  const normalizedSlug = slugify(rawSlug);
  const businessType = normalizeString(formData.get('businessType')) || 'studio_geral';
  const themeKey = normalizeString(formData.get('themeKey')) || getSuggestedThemeByBusinessType(businessType);

  const parsed = businessSchema.safeParse({
    ownerId: ownerId || '00000000-0000-0000-0000-000000000000',
    businessName: rawBusinessName,
    slug: normalizedSlug,
    city: formData.get('city'),
    whatsapp: formData.get('whatsapp'),
    instagram: formData.get('instagram'),
    address: formData.get('address'),
    description: formData.get('description'),
    tagline: formData.get('tagline'),
    businessType,
    themeKey,
    planName: SINGLE_PLAN_KEY,
    status: formData.get('status') || 'trial'
  });

  if (!parsed.success) {
    redirectWithCreateError(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  if (!ownerId) {
    if (!ownerName || !ownerEmail || !ownerPassword) {
      redirectWithCreateError('Informe nome, e-mail e senha da responsável pelo studio.');
    }

    if (ownerPassword.length < 6) {
      redirectWithCreateError('A senha da responsável precisa ter pelo menos 6 caracteres.');
    }
  }

  const admin = createAdminClient();
  let finalOwnerId = ownerId;
  let createdAuthUserId: string | null = null;
  let createdBusinessId: string | null = null;

  try {
    const { data: existingSlug, error: slugError } = await admin
      .from('businesses')
      .select('id')
      .eq('slug', parsed.data.slug)
      .maybeSingle();

    if (slugError) {
      throw new Error(`Erro ao verificar o slug: ${slugError.message}`);
    }

    if (existingSlug) {
      throw new Error('Esse slug público já está em uso. Escolha outro slug para este cliente.');
    }

    if (!finalOwnerId) {
      const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName
        }
      });

      if (authError || !createdUser.user) {
        const authMessage = authError?.message || 'Não foi possível criar o acesso da cliente.';

        if (
          authMessage.toLowerCase().includes('already') ||
          authMessage.toLowerCase().includes('registered') ||
          authMessage.toLowerCase().includes('exists')
        ) {
          throw new Error(
            'Esse e-mail já existe em Authentication > Users no Supabase. Apague esse usuário lá ou use outro e-mail.'
          );
        }

        throw new Error(authMessage);
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
        throw new Error(`Erro ao criar perfil da responsável: ${profileError.message}`);
      }
    }

    const { data: createdBusiness, error: businessError } = await admin
      .from('businesses')
      .insert({
        owner_id: finalOwnerId,
        business_name: parsed.data.businessName,
        slug: parsed.data.slug,
        city: parsed.data.city || null,
        whatsapp: parsed.data.whatsapp || null,
        instagram: parsed.data.instagram || null,
        address: parsed.data.address || null,
        description: parsed.data.description || null,
        tagline: parsed.data.tagline || null,
        business_type: parsed.data.businessType,
        theme_key: parsed.data.themeKey,
        plan_name: SINGLE_PLAN_KEY,
        status: parsed.data.status
      })
      .select('id')
      .single();

    if (businessError || !createdBusiness) {
      throw new Error(businessError?.message || 'Não foi possível criar o negócio.');
    }

    createdBusinessId = createdBusiness.id;

    const { month, year } = getCurrentReference();
    const { error: subscriptionError } = await admin
      .from('platform_subscriptions')
      .upsert(
        {
          business_id: createdBusiness.id,
          reference_month: month,
          reference_year: year,
          amount: Number(SINGLE_PLAN_PRICE.toFixed(2)),
          status: 'pending',
          due_date: getDefaultDueDate(month, year),
          notes: 'Mensalidade criada automaticamente ao cadastrar o cliente.',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'business_id,reference_month,reference_year' }
      );

    if (subscriptionError) {
      throw new Error(`Erro ao criar mensalidade: ${subscriptionError.message}`);
    }

  } catch (error) {
    if (createdBusinessId) {
      await admin.from('businesses').delete().eq('id', createdBusinessId);
    }

    if (createdAuthUserId) {
      await admin.auth.admin.deleteUser(createdAuthUserId);
    }

    redirectWithCreateError(getErrorMessage(error));
  }

  if (!createdBusinessId) {
    redirectWithCreateError('Não foi possível confirmar a criação do cliente.');
  }

  revalidateAdminBusinessPaths(createdBusinessId);
  redirect('/admin/clientes/' + createdBusinessId + '?success=' + encodeURIComponent('Cliente criado com sucesso.'));
}

export async function updateBusinessAdmin(formData: FormData): Promise<void> {
  await requireAdmin();

  const businessId = normalizeString(formData.get('businessId'));

  if (!businessId) {
    redirect('/admin/clientes?error=Cliente%20inv%C3%A1lido.');
  }

  const admin = createAdminClient();

  const { data: currentBusiness, error: businessError } = await admin
    .from('businesses')
    .select('id, business_type, theme_key')
    .eq('id', businessId)
    .single();

  if (businessError || !currentBusiness) {
    redirectWithUpdateError(businessId, businessError?.message || 'Cliente não encontrado.');
  }

  const nextBusinessName = normalizeString(formData.get('businessName'));
  const nextSlug = slugify(normalizeString(formData.get('slug')) || nextBusinessName);
  const nextBusinessType = normalizeString(formData.get('businessType')) || currentBusiness.business_type || 'studio_geral';
  const nextThemeKey =
    normalizeString(formData.get('themeKey')) ||
    currentBusiness.theme_key ||
    getSuggestedThemeByBusinessType(nextBusinessType);

  const parsed = businessSchema.safeParse({
    ownerId: '00000000-0000-0000-0000-000000000000',
    businessName: nextBusinessName,
    slug: nextSlug,
    city: formData.get('city'),
    whatsapp: formData.get('whatsapp'),
    instagram: formData.get('instagram'),
    address: formData.get('address'),
    description: formData.get('description'),
    tagline: formData.get('tagline'),
    businessType: nextBusinessType,
    themeKey: nextThemeKey,
    planName: SINGLE_PLAN_KEY,
    status: formData.get('status') || 'trial'
  });

  if (!parsed.success) {
    redirectWithUpdateError(businessId, parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const { data: slugOwner, error: slugError } = await admin
    .from('businesses')
    .select('id')
    .eq('slug', parsed.data.slug)
    .neq('id', businessId)
    .maybeSingle();

  if (slugError) {
    redirectWithUpdateError(businessId, `Erro ao verificar o slug: ${slugError.message}`);
  }

  if (slugOwner) {
    redirectWithUpdateError(businessId, 'Esse slug público já está em uso por outro cliente.');
  }

  const { error } = await admin
    .from('businesses')
    .update({
      status: parsed.data.status,
      plan_name: SINGLE_PLAN_KEY,
      business_name: parsed.data.businessName,
      city: parsed.data.city || null,
      whatsapp: parsed.data.whatsapp || null,
      instagram: parsed.data.instagram || null,
      address: parsed.data.address || null,
      tagline: parsed.data.tagline || null,
      description: parsed.data.description || null,
      slug: parsed.data.slug,
      business_type: parsed.data.businessType,
      theme_key: parsed.data.themeKey
    })
    .eq('id', businessId);

  if (error) {
    redirectWithUpdateError(businessId, error.message);
  }

  revalidateAdminBusinessPaths(businessId);
  redirect(`/admin/clientes/${businessId}?success=${encodeURIComponent('Cliente atualizado com sucesso.')}`);
}
