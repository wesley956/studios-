import Link from 'next/link';
import { updateBusinessAdmin } from '@/actions/admin-businesses';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { currencyBRL, formatDateBR, statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_KEY, SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

export default async function AdminClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data },
    { count: servicesCount },
    { count: customersCount },
    { count: requestsCount },
    { data: appointments },
    { data: payments }
  ] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, business_name, city, status, plan_name, slug, tagline, description, whatsapp, instagram, address, created_at, profiles:owner_id(full_name,email)')
      .eq('id', id)
      .single(),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase
      .from('appointments')
      .select('id, status, final_price, appointment_date, appointment_time, customers(full_name), services(name)')
      .eq('business_id', id)
      .order('appointment_date', { ascending: false })
      .limit(6),
    supabase.from('payments').select('amount, payment_status, paid_at').eq('business_id', id)
  ]);

  const business = data;
  const owner = business ? (Array.isArray(business.profiles) ? business.profiles[0] : business.profiles) : null;
  const receivedPayments = (payments || []).filter((item) => ['paid', 'partial'].includes(String(item.payment_status)));
  const totalRevenue = receivedPayments.reduce<number>((sum, item) => sum + Number(item.amount || 0), 0);
  const lastPaymentAt = [...receivedPayments]
    .sort((a, b) => String(b.paid_at || '').localeCompare(String(a.paid_at || '')))[0]?.paid_at;

  async function handleUpdateBusinessAdmin(formData: FormData): Promise<void> {
    'use server';
    await updateBusinessAdmin(formData);
  }

  return (
    <div>
      <TopHeading
        title={business?.business_name || 'Cliente'}
        description="Edite a conta, acompanhe receita e veja atividade recente da operação."
        action={
          business ? (
            <Link href={`/${business.slug}`} target="_blank" className="rounded-2xl border border-border bg-white px-5 py-3 transition hover:bg-primary-soft">
              Abrir página pública
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Serviços" value={servicesCount || 0} />
        <StatCard label="Clientes" value={customersCount || 0} />
        <StatCard label="Solicitações" value={requestsCount || 0} />
        <StatCard label="Receita acumulada" value={currencyBRL(totalRevenue)} hint={lastPaymentAt ? `Último recebimento: ${formatDateBR(String(lastPaymentAt).slice(0, 10))}` : 'Sem recebimentos'} tone="success" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <SectionCard title="Dados do cliente" description="Mantenha as informações comerciais e públicas do negócio atualizadas.">
          <form action={handleUpdateBusinessAdmin} className="space-y-6">
            <input type="hidden" name="businessId" value={business?.id || ''} />
            <input type="hidden" name="planName" value={SINGLE_PLAN_KEY} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome do negócio">
                <Input name="businessName" defaultValue={business?.business_name || ''} />
              </Field>
              <Field label="Slug público">
                <Input name="slug" defaultValue={business?.slug || ''} />
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
              <Field label="Status">
                <Select name="status" defaultValue={business?.status || 'trial'}>
                  <option value="trial">Teste</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </Select>
              </Field>
              <Field label="Plano contratado" className="md:col-span-2" hint={`Cobrança padrão atual: ${currencyBRL(SINGLE_PLAN_PRICE)}/mês`}>
                <div className="rounded-2xl border border-border bg-[#F7F3EE] px-4 py-3 font-medium">{SINGLE_PLAN_LABEL}</div>
              </Field>
              <div className="md:col-span-2">
                <Field label="Tagline pública">
                  <Input name="tagline" defaultValue={business?.tagline || ''} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Endereço">
                  <Input name="address" defaultValue={business?.address || ''} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Descrição">
                  <Textarea name="description" rows={5} defaultValue={business?.description || ''} />
                </Field>
              </div>
            </div>

            <SubmitButton>Salvar alterações do cliente</SubmitButton>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Responsável e conta" description="Visão operacional rápida da dona do negócio e do estado comercial atual.">
            <div className="grid gap-4 md:grid-cols-2">
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
              <div className="md:col-span-2 rounded-2xl border border-border bg-[#F7F3EE] p-4">
                <p className="text-sm text-muted">Plano comercial</p>
                <p className="mt-1 font-medium">{SINGLE_PLAN_LABEL}</p>
                <p className="mt-1 text-sm text-muted">Valor definido: {currencyBRL(SINGLE_PLAN_PRICE)}/mês</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Últimos atendimentos" description="Ajuda a entender se o studio está operando e registrando atividade recente.">
            <div className="space-y-3">
              {appointments?.length ? (
                appointments.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{(item.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</p>
                        <p className="text-sm text-muted">
                          {(item.services as { name?: string } | null)?.name || 'Serviço'} • {formatDateBR(item.appointment_date)} às {item.appointment_time?.slice(0, 5)}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={item.status === 'completed' ? 'success' : item.status === 'confirmed' ? 'neutral' : 'danger'}>
                          {statusLabel(item.status)}
                        </StatusBadge>
                        <p className="mt-2 text-sm font-medium">{currencyBRL(item.final_price)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Sem atividade recente ainda.</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
