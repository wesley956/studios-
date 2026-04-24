import { TopHeading, SectionCard } from '@/components/shared/shell';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { Field, Input, SubmitButton, Textarea } from '@/components/shared/forms';
import { updateBusinessSettings } from '@/actions/client-settings';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_BUSINESS_HOURS } from '@/lib/schedule';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default async function ConfiguracoesPage() {
  await requireClientOwner();
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const { data: businessHours } = await supabase.from('business_hours').select('*').eq('business_id', business.id).order('day_of_week');

  async function handleUpdateBusinessSettings(formData: FormData): Promise<void> {
    'use server';
    await updateBusinessSettings(formData);
  }

  const hours = DEFAULT_BUSINESS_HOURS.map((defaultHour) => businessHours?.find((item) => item.day_of_week === defaultHour.day_of_week) || defaultHour);

  return (
    <div>
      <TopHeading title="Configurações" description="Ajuste os dados do negócio, a apresentação pública e as regras da sua agenda profissional." />

      <form action={handleUpdateBusinessSettings} className="grid gap-6">
        <SectionCard title="Marca e apresentação pública" description="Essas informações fortalecem a página pública e melhoram sua percepção de produto.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do negócio"><Input name="businessName" defaultValue={business.business_name} /></Field>
            <Field label="Slug público" hint="Usado no link do seu mini site."><Input name="slug" defaultValue={business.slug} /></Field>
            <Field label="Tagline / frase de impacto"><Input name="tagline" defaultValue={business.tagline || ''} placeholder="Ex.: Beleza com hora marcada e experiência premium" /></Field>
            <Field label="Cidade"><Input name="city" defaultValue={business.city || ''} /></Field>
            <Field label="WhatsApp"><Input name="whatsapp" defaultValue={business.whatsapp || ''} /></Field>
            <Field label="Instagram"><Input name="instagram" defaultValue={business.instagram || ''} /></Field>
            <Field label="Endereço" className="md:col-span-2"><Input name="address" defaultValue={business.address || ''} /></Field>
            <Field label="URL do logo" hint="Cole a URL de uma imagem para reforçar a marca."><Input name="logoUrl" defaultValue={business.logo_url || ''} /></Field>
            <Field label="URL da capa" hint="Use uma imagem bonita para a área principal do mini site."><Input name="coverUrl" defaultValue={business.cover_url || ''} /></Field>
            <Field label="Descrição" className="md:col-span-2"><Textarea name="description" rows={5} defaultValue={business.description || ''} /></Field>
            <Field label="Observação pública" className="md:col-span-2" hint="Ex.: atendimento mediante confirmação, estacionamento, política de atraso."><Textarea name="publicNote" rows={3} defaultValue={business.public_note || ''} /></Field>
          </div>
        </SectionCard>

        <SectionCard title="Regras da agenda" description="Defina antecedência mínima, intervalo entre horários e quantos dias podem ser abertos na agenda pública.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Intervalo entre slots (min)"><Input name="bookingIntervalMinutes" type="number" defaultValue={business.booking_interval_minutes || 15} /></Field>
            <Field label="Janela de agendamento (dias)"><Input name="bookingWindowDays" type="number" defaultValue={business.booking_window_days || 30} /></Field>
            <Field label="Antecedência mínima (horas)"><Input name="bookingLeadTimeHours" type="number" defaultValue={business.booking_lead_time_hours || 2} /></Field>
          </div>
        </SectionCard>

        <SectionCard title="Horários de funcionamento" description="A agenda pública só oferece horários dentro da faixa marcada como aberta.">
          <div className="space-y-4">
            {hours.map((hour) => (
              <div key={hour.day_of_week} className="grid gap-4 rounded-2xl border border-border p-4 md:grid-cols-[180px,120px,1fr,1fr] md:items-center">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name={`isOpen_${hour.day_of_week}`} defaultChecked={hour.is_open} />
                  {weekdays[hour.day_of_week]}
                </label>
                <span className="text-sm text-muted">{hour.is_open ? 'Aberto' : 'Fechado'}</span>
                <Field label="Abre" className="mb-0"><Input name={`openTime_${hour.day_of_week}`} type="time" defaultValue={hour.open_time?.slice(0, 5)} /></Field>
                <Field label="Fecha" className="mb-0"><Input name={`closeTime_${hour.day_of_week}`} type="time" defaultValue={hour.close_time?.slice(0, 5)} /></Field>
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
