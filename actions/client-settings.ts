'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { businessSchema } from '@/lib/validations/business';
import { slugify } from '@/lib/utils';
import { getCurrentBusiness } from '@/lib/auth';
import { DEFAULT_BUSINESS_HOURS } from '@/lib/schedule';

function normalize(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

export async function updateBusinessSettings(formData: FormData): Promise<void> {
  const currentBusiness = await getCurrentBusiness();

  const parsed = businessSchema.safeParse({
    ownerId: currentBusiness.owner_id,
    businessName: formData.get('businessName'),
    slug: slugify(String(formData.get('slug') || formData.get('businessName') || '')),
    city: formData.get('city'),
    whatsapp: formData.get('whatsapp'),
    instagram: formData.get('instagram'),
    address: formData.get('address'),
    description: formData.get('description'),
    planName: currentBusiness.plan_name,
    status: currentBusiness.status
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Dados inválidos.');
  }

  const slotInterval = Number(formData.get('bookingIntervalMinutes') || currentBusiness.booking_interval_minutes || 15);
  const bookingWindow = Number(formData.get('bookingWindowDays') || currentBusiness.booking_window_days || 30);
  const leadTime = Number(formData.get('bookingLeadTimeHours') || currentBusiness.booking_lead_time_hours || 2);

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
      tagline: normalize(formData.get('tagline')) || null,
      public_note: normalize(formData.get('publicNote')) || null,
      logo_url: normalize(formData.get('logoUrl')) || null,
      cover_url: normalize(formData.get('coverUrl')) || null,
      booking_interval_minutes: Number.isFinite(slotInterval) ? slotInterval : 15,
      booking_window_days: Number.isFinite(bookingWindow) ? bookingWindow : 30,
      booking_lead_time_hours: Number.isFinite(leadTime) ? leadTime : 2
    })
    .eq('id', currentBusiness.id)
    .eq('owner_id', currentBusiness.owner_id);

  if (error) throw new Error(error.message);

  const hoursToPersist = DEFAULT_BUSINESS_HOURS.map((day) => ({
    business_id: currentBusiness.id,
    day_of_week: day.day_of_week,
    is_open: formData.get(`isOpen_${day.day_of_week}`) === 'on',
    open_time: normalize(formData.get(`openTime_${day.day_of_week}`)) || day.open_time,
    close_time: normalize(formData.get(`closeTime_${day.day_of_week}`)) || day.close_time
  }));

  const { error: hoursError } = await supabase.from('business_hours').upsert(hoursToPersist, { onConflict: 'business_id,day_of_week' });
  if (hoursError) throw new Error(hoursError.message);

  revalidatePath('/app/configuracoes');
  revalidatePath('/app');
  revalidatePath(`/${parsed.data.slug}`);
  revalidatePath(`/${parsed.data.slug}/agendar`);
}
