import Link from 'next/link';
import { updateBusinessAdmin } from '@/actions/admin-businesses';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { formatDateBR, statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

export default async function AdminClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data },
    { count: servicesCount },
    { count: customersCount },
    { count: requestsCount },
    { count: appointmentsCount },
    { data: latestRequests },
    { data: appointments }
  ] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, business_name, city, status, plan_name, slug, tagline, description, whatsapp, instagram, address, created_at, profiles:owner_id(full_name,email)')
      .eq('id', id)
      .single(),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase
      .from('booking_requests')
      .select('id, preferred_date, preferred_time, status, service_name, customer_name')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('appointments')
      .select('id, status, appointment_date, appointment_time, customers(full_name), services(name)')
      .eq('business_id', id)
      .order('appointment_date', { ascending: false })
      .limit(6)
  ]);

  const business = data;
  const owner = business ? (Array.isArray(business.profiles) ? business.profiles[0] : business.profiles) : null;
  const publicReady = Boolean(business?.slug) && Number(servicesCount || 0) > 0;
  const onboardingScore = Math.min(
    100,
    (servicesCount ? 25 : 0) + (customersCount ? 20 : 0) + (requestsCount ? 25 : 0) + (appointmentsCount ? 30 : 0)
  );

  async function handleUpdateBusinessAdmin(formData: FormData): Promise<void> {
    'use server';
    await updateBusinessAdmin(formData);
  }

  return (
    <div>
      <TopHeading
        title={business?.business_name || 'Cliente'}
        description="Visão administrativa focada em configuração, uso e atividade do studio — sem expor o faturamento interno dele."
        action={
          business?.slug ? (
            <Link href={`/${business.slug}`} className="rounded-2xl border border-border bg-white px-5 py-3 transition hover:bg-primary-soft">
              Abrir página pública
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Serviços" value={servicesCount || 0} hint={publicReady ? 'Página pronta para divulgar' : 'Precisa cadastrar serviços'} />
        <StatCard label="Clientes" value={customersCount || 0} hint="Base própria do studio" />
        <StatCard label="Solicitações" value={requestsCount || 0} hint="Demanda gerada pela página pública" />
        <StatCard label="Agenda" value={appointmentsCount || 0} hint="Atendimentos registrados" />
        <StatCard label="Ativação" value={`${onboardingScore}%`} hint={`Plano único de R$ ${SINGLE_PLAN_PRICE.toFixed(2).replace('.', ',')}`} tone={onboardingScore >= 70 ? 'success' : onboardingScore >= 40 ? 'warning' : 'dark'} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard title="Dados do cliente" description="Atualize a conta do studio dentro da plataforma.">
          <form action={handleUpdateBusinessAdmin} className="space-y-5">
            <input type="hidden" name="businessId" value={business?.id || ''} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome do negócio">
                <Input name="businessName" defaultValue={business?.business_name || ''} required />
              </Field>
              <Field label="Slug público">
                <Input name="slug" defaultValue={business?.slug || ''} required />
              </Field>
              <Field label="Cidade">
                <Input name="city" defaultValue={business?.city || ''} />
              </Field>
              <Field label="WhatsApp">
                <Input name="whatsapp" defaultValue={business?.whatsapp || ''} />
              </Field>
              <Field label="Instagram">
                <Input name="instagram" defaultValue={business?.instagram || ''} />
              </Field>
              <Field label="Status do cliente">
                <Select name="status" defaultValue={business?.status || 'trial'}>
                  <option value="trial">Teste</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </Select>
              </Field>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary-soft p-4">
              <p className="text-sm font-medium">Plano comercial atual</p>
              <p className="mt-1 text-sm text-muted">{SINGLE_PLAN_LABEL} • R$ {SINGLE_PLAN_PRICE.toFixed(2).replace('.', ',')}/mês. Esse valor é controlado por você, não pelo studio.</p>
            </div>

            <Field label="Endereço">
              <Input name="address" defaultValue={business?.address || ''} />
            </Field>

            <Field label="Tagline">
              <Input name="tagline" defaultValue={business?.tagline || ''} />
            </Field>

            <Field label="Descrição pública">
              <Textarea name="description" rows={5} defaultValue={business?.description || ''} />
            </Field>

            <SubmitButton>Salvar alterações do cliente</SubmitButton>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Responsável e assinatura" description="Informações principais do relacionamento com o cliente.">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Responsável</p>
                <p className="mt-1 font-medium">{owner?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Email</p>
                <p className="mt-1 font-medium">{owner?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Status atual</p>
                <div className="mt-2">
                  <StatusBadge status={business?.status === 'active' ? 'success' : business?.status === 'trial' ? 'warning' : 'danger'}>
                    {statusLabel(business?.status || '')}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted">Criado em</p>
                <p className="mt-1 font-medium">{formatDateBR(business?.created_at?.slice(0, 10))}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Página pública</p>
                <p className="mt-1 font-medium">{publicReady ? 'Pronta para divulgar' : 'Ainda incompleta'}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Leitura rápida" description="Como esse cliente está avançando no uso da plataforma.">
            <ul className="space-y-3 text-sm text-muted">
              <li>• {servicesCount ? 'Já cadastrou serviços.' : 'Ainda precisa cadastrar serviços.'}</li>
              <li>• {requestsCount ? 'Já recebeu solicitações públicas.' : 'Ainda não recebeu solicitações públicas.'}</li>
              <li>• {appointmentsCount ? 'Já está usando agenda.' : 'Ainda não está usando agenda.'}</li>
              <li>• {publicReady ? 'A página pública está minimamente pronta.' : 'Falta terminar a página pública antes de divulgar.'}</li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Últimos atendimentos" description="Atividade operacional recente do studio, sem mostrar valores financeiros.">
          <div className="space-y-3">
            {appointments?.length ? (
              appointments.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{(item.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</p>
                      <p className="text-sm text-muted">{(item.services as { name?: string } | null)?.name || 'Serviço'} • {formatDateBR(item.appointment_date)} às {item.appointment_time?.slice(0, 5)}</p>
                    </div>
                    <StatusBadge status={item.status === 'completed' ? 'success' : item.status === 'confirmed' ? 'neutral' : 'warning'}>
                      {statusLabel(item.status)}
                    </StatusBadge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Sem atividade recente ainda.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Últimas solicitações" description="Leitura do interesse gerado pela página pública.">
          <div className="space-y-3">
            {latestRequests?.length ? (
              latestRequests.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{item.customer_name || 'Cliente'}</p>
                      <p className="text-sm text-muted">{item.service_name || 'Serviço'} • {formatDateBR(item.preferred_date)} às {item.preferred_time?.slice(0, 5)}</p>
                    </div>
                    <StatusBadge status={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}>
                      {statusLabel(item.status)}
                    </StatusBadge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Ainda não existem solicitações recentes.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
