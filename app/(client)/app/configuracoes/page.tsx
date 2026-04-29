import { TopHeading, SectionCard } from '@/components/shared/shell';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { updateBusinessSettings } from '@/actions/client-settings';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_BUSINESS_HOURS } from '@/lib/schedule';
import { BUSINESS_TYPE_OPTIONS, THEME_OPTIONS, getSuggestedThemeByBusinessType } from '@/lib/themes';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type ConfiguracoesPageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  await requireClientOwner();

  const params = searchParams ? await searchParams : undefined;
  const saved = params?.saved === '1';
  const errorMessage = typeof params?.error === 'string' ? params.error : null;

  const business = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: businessHours }, { data: galleryImages }] = await Promise.all([
    supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', business.id)
      .order('day_of_week'),
    supabase
      .from('gallery_images')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true })
  ]);

  async function handleUpdateBusinessSettings(formData: FormData): Promise<void> {
    'use server';
    await updateBusinessSettings(formData);
  }

  const hours = DEFAULT_BUSINESS_HOURS.map(
    (defaultHour) => businessHours?.find((item) => item.day_of_week === defaultHour.day_of_week) || defaultHour
  );

  const gallerySlots = [0, 1, 2].map((index) =>
    galleryImages?.find((item) => Number(item.sort_order) === index) || null
  );

  return (
    <div>
      <TopHeading
        title="Configurações do negócio"
        description="Edite as informações do studio, defina o tipo do negócio, ajuste o tema visual e organize as regras da agenda."
      />

      {saved && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Configurações salvas com sucesso. A página pública já foi atualizada.
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <form action={handleUpdateBusinessSettings} className="space-y-6" encType="multipart/form-data">
        <SectionCard
          title="Informações principais"
          description="Esses dados aparecem no painel e alimentam a página pública."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do negócio">
              <Input name="businessName" defaultValue={business.business_name || ''} required />
            </Field>

            <Field label="Slug público">
              <Input name="slug" defaultValue={business.slug || ''} required />
            </Field>

            <Field label="Tipo do negócio">
              <Select name="businessType" defaultValue={business.business_type || 'studio_geral'}>
                {BUSINESS_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tema visual">
              <Select
                name="themeKey"
                defaultValue={business.theme_key || getSuggestedThemeByBusinessType(business.business_type)}
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Cidade">
              <Input name="city" defaultValue={business.city || ''} />
            </Field>

            <Field label="WhatsApp">
              <Input name="whatsapp" defaultValue={business.whatsapp || ''} />
            </Field>

            <Field label="Instagram">
              <Input name="instagram" defaultValue={business.instagram || ''} />
            </Field>

            <Field label="Endereço">
              <Input name="address" defaultValue={business.address || ''} />
            </Field>

            <Field label="Frase de destaque" className="md:col-span-2" hint="Frase curta que aparece logo no topo da página pública.">
              <Input name="tagline" defaultValue={business.tagline || ''} />
            </Field>

            <Field label="Descrição do negócio" className="md:col-span-2">
              <Textarea name="description" rows={4} defaultValue={business.description || ''} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Fotos da página pública"
          description="Envie imagens direto do computador ou celular. Não precisa mais colar URL."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Logo"
              hint="Imagem quadrada ou com pouco texto. Formatos: JPG, PNG, WEBP ou GIF. Máximo: 5 MB."
            >
              <div className="rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4">
                {business.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logo_url}
                    alt="Logo atual"
                    className="mb-4 h-24 w-24 rounded-2xl object-cover"
                  />
                ) : (
                  <p className="mb-4 text-sm text-muted">Nenhuma logo enviada ainda.</p>
                )}
                <Input name="logoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
              </div>
            </Field>

            <Field
              label="Capa"
              hint="Foto horizontal para o topo da página. Formatos: JPG, PNG, WEBP ou GIF. Máximo: 5 MB."
            >
              <div className="rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4">
                {business.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.cover_url}
                    alt="Capa atual"
                    className="mb-4 h-36 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <p className="mb-4 text-sm text-muted">Nenhuma capa enviada ainda.</p>
                )}
                <Input name="coverFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Galeria da página pública"
          description="Adicione até 3 fotos para mostrar ambiente, resultados, equipe ou detalhes do atendimento."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {gallerySlots.map((image, index) => (
              <div key={index} className="rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4">
                <p className="text-sm font-medium text-text">Foto {index + 1}</p>

                {image?.image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={`Foto ${index + 1} da galeria`}
                      className="mt-3 h-40 w-full rounded-2xl object-cover"
                    />
                    <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                      <input type="checkbox" name={`removeGallery_${index}`} />
                      Remover foto atual
                    </label>
                  </>
                ) : (
                  <div className="mt-3 flex h-40 items-center justify-center rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted">
                    Nenhuma foto enviada.
                  </div>
                )}

                <Input
                  name={`galleryFile_${index}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="mt-4"
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Observação pública"
          description="Use esse campo para mostrar uma informação realmente útil para a cliente antes de agendar."
        >
          <Field
            label="Aviso para clientes"
            hint="Ex.: atendimento mediante confirmação, tolerância de atraso, estacionamento, sinal para reserva."
          >
            <Textarea name="publicNote" rows={3} defaultValue={business.public_note || ''} />
          </Field>
        </SectionCard>

        <SectionCard
          title="Regras da agenda"
          description="Defina antecedência mínima, intervalo entre horários e quantos dias podem ser abertos na agenda pública."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Intervalo entre horários (min)">
              <Input
                name="bookingIntervalMinutes"
                type="number"
                min={5}
                step={5}
                defaultValue={business.booking_interval_minutes || 15}
              />
            </Field>

            <Field label="Janela de agendamento (dias)">
              <Input
                name="bookingWindowDays"
                type="number"
                min={1}
                defaultValue={business.booking_window_days || 30}
              />
            </Field>

            <Field label="Antecedência mínima (horas)">
              <Input
                name="bookingLeadTimeHours"
                type="number"
                min={0}
                defaultValue={business.booking_lead_time_hours || 2}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Horários de funcionamento"
          description="Esses dias e horários aparecem na página pública e também controlam a agenda disponível."
        >
          <div className="space-y-4">
            {hours.map((hour) => (
              <div
                key={hour.day_of_week}
                className="grid gap-4 rounded-2xl border border-border p-4 md:grid-cols-[180px,120px,1fr,1fr] md:items-center"
              >
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name={`isOpen_${hour.day_of_week}`}
                    defaultChecked={hour.is_open}
                  />
                  {weekdays[hour.day_of_week]}
                </label>

                <span className="text-sm text-muted">{hour.is_open ? 'Aberto' : 'Fechado'}</span>

                <Field label="Abre" className="mb-0">
                  <Input
                    name={`openTime_${hour.day_of_week}`}
                    type="time"
                    defaultValue={hour.open_time?.slice(0, 5)}
                  />
                </Field>

                <Field label="Fecha" className="mb-0">
                  <Input
                    name={`closeTime_${hour.day_of_week}`}
                    type="time"
                    defaultValue={hour.close_time?.slice(0, 5)}
                  />
                </Field>
              </div>
            ))}
          </div>
        </SectionCard>

        <div>
          <SubmitButton>Salvar alterações</SubmitButton>
        </div>
      </form>
    </div>
  );
}
