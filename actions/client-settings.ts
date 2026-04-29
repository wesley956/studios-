'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { businessSchema, SINGLE_PLAN_KEY } from '@/lib/validations/business';
import { getCurrentBusiness } from '@/lib/auth';
import { getSuggestedThemeByBusinessType } from '@/lib/themes';
import { DEFAULT_BUSINESS_HOURS } from '@/lib/schedule';
import { slugify } from '@/lib/utils';

const MEDIA_BUCKET = 'business-media';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function normalize(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function fail(message: string): never {
  redirect(`/app/configuracoes?error=${encodeURIComponent(message)}`);
}

function success(): never {
  redirect('/app/configuracoes?saved=1');
}

function isUploadableFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== 'undefined' && value instanceof File && value.size > 0;
}

function getImageExtension(file: File) {
  const byType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };

  if (byType[file.type]) return byType[file.type];

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return extension || 'jpg';
}

function validateImage(file: File, label: string) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    fail(`${label}: envie uma imagem JPG, PNG, WEBP ou GIF.`);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    fail(`${label}: a imagem precisa ter no máximo 5 MB.`);
  }
}

async function uploadBusinessImage({
  file,
  folder,
  businessId,
  ownerId
}: {
  file: File;
  folder: string;
  businessId: string;
  ownerId: string;
}) {
  validateImage(file, folder === 'logo' ? 'Logo' : folder === 'cover' ? 'Capa' : 'Galeria');

  const admin = createAdminClient();
  const extension = getImageExtension(file);
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  const path = `${ownerId}/${businessId}/${safeFolder}-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    fail(`Não foi possível enviar a imagem (${folder}): ${error.message}`);
  }

  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function updateBusinessSettings(formData: FormData): Promise<void> {
  const currentBusiness = await getCurrentBusiness();
  const previousSlug = currentBusiness.slug;

  const businessType = normalize(formData.get('businessType')) || currentBusiness.business_type || 'studio_geral';
  const themeKey =
    normalize(formData.get('themeKey')) ||
    currentBusiness.theme_key ||
    getSuggestedThemeByBusinessType(businessType);

  const parsed = businessSchema.safeParse({
    ownerId: currentBusiness.owner_id,
    businessName: formData.get('businessName'),
    slug: slugify(String(formData.get('slug') || formData.get('businessName') || '')),
    city: formData.get('city'),
    whatsapp: formData.get('whatsapp'),
    instagram: formData.get('instagram'),
    address: formData.get('address'),
    description: formData.get('description'),
    tagline: formData.get('tagline'),
    businessType,
    themeKey,
    planName: SINGLE_PLAN_KEY,
    status: currentBusiness.status
  });

  if (!parsed.success) {
    fail(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const slotInterval = Number(formData.get('bookingIntervalMinutes') || currentBusiness.booking_interval_minutes || 15);
  const bookingWindow = Number(formData.get('bookingWindowDays') || currentBusiness.booking_window_days || 30);
  const leadTime = Number(formData.get('bookingLeadTimeHours') || currentBusiness.booking_lead_time_hours || 2);

  const logoFile = formData.get('logoFile');
  const coverFile = formData.get('coverFile');

  const logoUrl = isUploadableFile(logoFile)
    ? await uploadBusinessImage({
        file: logoFile,
        folder: 'logo',
        businessId: currentBusiness.id,
        ownerId: currentBusiness.owner_id
      })
    : currentBusiness.logo_url || null;

  const coverUrl = isUploadableFile(coverFile)
    ? await uploadBusinessImage({
        file: coverFile,
        folder: 'cover',
        businessId: currentBusiness.id,
        ownerId: currentBusiness.owner_id
      })
    : currentBusiness.cover_url || null;

  const supabase = await createClient();

  const { error } = await supabase
    .from('businesses')
    .update({
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
      public_note: normalize(formData.get('publicNote')) || null,
      logo_url: logoUrl,
      cover_url: coverUrl,
      booking_interval_minutes: Number.isFinite(slotInterval) ? slotInterval : 15,
      booking_window_days: Number.isFinite(bookingWindow) ? bookingWindow : 30,
      booking_lead_time_hours: Number.isFinite(leadTime) ? leadTime : 2
    })
    .eq('id', currentBusiness.id)
    .eq('owner_id', currentBusiness.owner_id);

  if (error) {
    fail(error.message);
  }

  const hoursToPersist = DEFAULT_BUSINESS_HOURS.map((day) => ({
    business_id: currentBusiness.id,
    day_of_week: day.day_of_week,
    is_open: formData.get(`isOpen_${day.day_of_week}`) === 'on',
    open_time: normalize(formData.get(`openTime_${day.day_of_week}`)) || day.open_time,
    close_time: normalize(formData.get(`closeTime_${day.day_of_week}`)) || day.close_time
  }));

  const { error: hoursError } = await supabase
    .from('business_hours')
    .upsert(hoursToPersist, { onConflict: 'business_id,day_of_week' });

  if (hoursError) {
    fail(hoursError.message);
  }

  const admin = createAdminClient();

  for (let index = 0; index < 3; index += 1) {
    const removeCurrent = formData.get(`removeGallery_${index}`) === 'on';
    const galleryFile = formData.get(`galleryFile_${index}`);

    if (removeCurrent) {
      const { error: deleteError } = await admin
        .from('gallery_images')
        .delete()
        .eq('business_id', currentBusiness.id)
        .eq('sort_order', index);

      if (deleteError) {
        fail(`Não foi possível remover a foto ${index + 1}: ${deleteError.message}`);
      }
    }

    if (isUploadableFile(galleryFile)) {
      const imageUrl = await uploadBusinessImage({
        file: galleryFile,
        folder: `galeria-${index + 1}`,
        businessId: currentBusiness.id,
        ownerId: currentBusiness.owner_id
      });

      const { data: currentGalleryItem, error: galleryReadError } = await admin
        .from('gallery_images')
        .select('id')
        .eq('business_id', currentBusiness.id)
        .eq('sort_order', index)
        .maybeSingle();

      if (galleryReadError) {
        fail(`Não foi possível verificar a foto ${index + 1}: ${galleryReadError.message}`);
      }

      if (currentGalleryItem?.id) {
        const { error: updateGalleryError } = await admin
          .from('gallery_images')
          .update({ image_url: imageUrl })
          .eq('id', currentGalleryItem.id);

        if (updateGalleryError) {
          fail(`Não foi possível atualizar a foto ${index + 1}: ${updateGalleryError.message}`);
        }
      } else {
        const { error: insertGalleryError } = await admin.from('gallery_images').insert({
          business_id: currentBusiness.id,
          image_url: imageUrl,
          sort_order: index
        });

        if (insertGalleryError) {
          fail(`Não foi possível salvar a foto ${index + 1}: ${insertGalleryError.message}`);
        }
      }
    }
  }

  revalidatePath('/app/configuracoes');
  revalidatePath('/app');
  revalidatePath(`/${previousSlug}`);
  revalidatePath(`/${parsed.data.slug}`);
  revalidatePath(`/${parsed.data.slug}/agendar`);

  success();
}
