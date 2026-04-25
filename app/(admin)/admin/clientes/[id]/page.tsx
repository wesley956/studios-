import Link from 'next/link';
import { updateBusinessAdmin } from '@/actions/admin-businesses';
import {
  confirmSubscriptionPayment,
  createSubscriptionRecord,
  deleteSubscriptionRecord,
  ensureCurrentMonthSubscription,
  markSubscriptionPending,
  updateSubscriptionRecord
} from '@/actions/admin-subscriptions';
import { Field, Input, Select, SubmitButton, Textarea, DangerButton, SecondaryButton } from '@/components/shared/forms';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { formatDateBR, statusLabel } from '@/lib/utils';
import { BUSINESS_TYPE_OPTIONS, THEME_OPTIONS } from '@/lib/themes';
import { SINGLE_PLAN_KEY, SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

type SubscriptionRow = {
  id: string;
  business_id: string;
  reference_month: number;
  reference_year: number;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
};

function getCurrentReference() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function daysUntil(dateString: string) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(`${dateString}T00:00:00`);
  return Math.round((due.getTime() - todayOnly.getTime()) / 86400000);
}

function getBillingVisual(subscription: SubscriptionRow | null) {
  if (!subscription) {
    return {
      label: 'Sem cobrança do mês',
      tone: 'dark' as const,
      hint: 'Gere a cobrança atual'
    };
  }

  if (subscription.status === 'paid') {
    return {
      label: 'Pago',
      tone: 'success' as const,
      hint: subscription.paid_at ? `Pago em ${formatDateBR(subscription.paid_at.slice(0, 10))}` : 'Pagamento confirmado'
    };
  }

  if (subscription.status === 'waived') {
    return {
      label: 'Isento',
      tone: 'neutral' as const,
      hint: 'Cobrança dispensada'
    };
  }

  const diff = daysUntil(subscription.due_date);

  if (diff < 0 || subscription.status === 'overdue') {
    return {
      label: 'Atrasado',
      tone: 'danger' as const,
      hint: `Venceu há ${Math.abs(diff)} dia(s)`
    };
  }

  if (diff <= 5) {
    return {
      label: 'Vencendo em breve',
      tone: 'warning' as const,
      hint: diff === 0 ? 'Vence hoje' : `Vence em ${diff} dia(s)`
    };
  }

  return {
    label: 'Pendente',
    tone: 'warning' as const,
    hint: `Vence em ${diff} dia(s)`
  };
}

export default async function AdminClienteDetalhePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { month, year } = getCurrentReference();

  const [
    { data },
    { count: servicesCount },
    { count: customersCount },
    { count: requestsCount },
    { count: appointmentsCount },
    { data: latestRequests },
    { data: appointments },
    { data: subscriptions }
  ] = await Promise.all([
    supabase
      .from('businesses')
      .select(
        'id, owner_id, business_name, city, status, plan_name, slug, tagline, description, whatsapp, instagram, address, created_at, business_type, theme_key, profiles:owner_id(full_name,email)'
      )
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
      .limit(6),
    supabase
      .from('platform_subscriptions')
      .select('*')
      .eq('business_id', id)
      .order('reference_year', { ascending: false })
      .order('reference_month', { ascending: false })
  ]);

  const business = data;
  const owner = business ? (Array.isArray(business.profiles) ? business.profiles[0] : business.profiles) : null;

  const publicReady = Boolean(business?.slug) && Number(servicesCount || 0) > 0;
  const onboardingScore = Math.min(
    100,
    (servicesCount ? 25 : 0) +
      (customersCount ? 20 : 0) +
      (requestsCount ? 25 : 0) +
      (appointmentsCount ? 30 : 0)
  );

  const subscriptionRows = (subscriptions || []) as SubscriptionRow[];
  const currentSubscription =
    subscriptionRows.find((item) => item.reference_month === month && item.reference_year === year) || null;
  const billing = getBillingVisual(currentSubscription);

  async function handleUpdateBusinessAdmin(formData: FormData): Promise<void> {
    'use server';
    await updateBusinessAdmin(formData);
  }

  if (!business) {
    return <div className="text-sm text-muted">Cliente não encontrado.</div>;
  }

  return (
    <div>
      <TopHeading
        title={business.business_name}
        description="Gerencie dados do studio, acompanhe a mensalidade do seu sistema e veja o uso da plataforma."
        action={
          business.slug ? (
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="rounded-2xl border border-border bg-white px-5 py-3 text-sm font-medium transition hover:bg-primary-soft"
            >
              Abrir página pública
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Serviços" value={servicesCount || 0} hint="Catálogo ativo" />
        <StatCard label="Clientes" value={customersCount || 0} hint="Base do studio" />
        <StatCard label="Solicitações" value={requestsCount || 0} hint="Interesse gerado pela página" />
        <StatCard
          label="Score de ativação"
          value={`${onboardingScore}%`}
          hint={publicReady ? 'Página pública pronta' : 'Página pública ainda incompleta'}
          tone={onboardingScore >= 70 ? 'success' : onboardingScore >= 40 ? 'warning' : 'dark'}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard title="Dados do cliente" description="Edite status, dados do negócio e identidade do studio.">
          <form action={handleUpdateBusinessAdmin} className="space-y-4">
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="planName" value={SINGLE_PLAN_KEY} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome do negócio">
                <Input name="businessName" defaultValue={business.business_name || ''} />
              </Field>

              <Field label="Slug público">
                <Input name="slug" defaultValue={business.slug || ''} />
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
                <Select name="themeKey" defaultValue={business.theme_key || 'modern_neutral'}>
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Status da conta">
                <Select name="status" defaultValue={business.status}>
                  <option value="trial">Teste</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </Select>
              </Field>

              <Field label="Tagline" className="md:col-span-2">
                <Input name="tagline" defaultValue={business.tagline || ''} />
              </Field>

              <Field label="Descrição" className="md:col-span-2">
                <Textarea name="description" rows={4} defaultValue={business.description || ''} />
              </Field>
            </div>

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
                  <StatusBadge status={business.status === 'active' ? 'success' : business.status === 'trial' ? 'warning' : 'danger'}>
                    {statusLabel(business.status || '')}
                  </StatusBadge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted">Criado em</p>
                <p className="mt-1 font-medium">{formatDateBR(business.created_at?.slice(0, 10))}</p>
              </div>

              <div>
                <p className="text-sm text-muted">Página pública</p>
                <p className="mt-1 font-medium">{publicReady ? 'Pronta para divulgar' : 'Ainda incompleta'}</p>
              </div>

              <div>
                <p className="text-sm text-muted">Plano comercial</p>
                <p className="mt-1 font-medium">
                  {SINGLE_PLAN_LABEL} • R$ {SINGLE_PLAN_PRICE.toFixed(2).replace('.', ',')}/mês
                </p>
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

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr,1fr]">
        <SectionCard
          title={`Mensalidade de ${String(month).padStart(2, '0')}/${year}`}
          description="Aqui você controla se a cliente pagou o seu sistema neste mês."
        >
          {currentSubscription ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={billing.tone}>{billing.label}</StatusBadge>
                <span className="text-sm text-muted">{billing.hint}</span>
              </div>

              <form action={updateSubscriptionRecord} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="subscriptionId" value={currentSubscription.id} />
                <input type="hidden" name="businessId" value={business.id} />

                <Field label="Mês">
                  <Input name="referenceMonth" type="number" min={1} max={12} defaultValue={currentSubscription.reference_month} />
                </Field>

                <Field label="Ano">
                  <Input name="referenceYear" type="number" defaultValue={currentSubscription.reference_year} />
                </Field>

                <Field label="Valor">
                  <Input name="amount" defaultValue={String(currentSubscription.amount).replace('.', ',')} />
                </Field>

                <Field label="Vencimento">
                  <Input name="dueDate" type="date" defaultValue={currentSubscription.due_date} />
                </Field>

                <Field label="Status">
                  <Select name="status" defaultValue={currentSubscription.status}>
                    <option value="pending">Pendente</option>
                    <option value="overdue">Atrasado</option>
                    <option value="paid">Pago</option>
                    <option value="waived">Isento</option>
                  </Select>
                </Field>

                <Field label="Forma de pagamento">
                  <Select name="paymentMethod" defaultValue={currentSubscription.payment_method || ''}>
                    <option value="">Não informado</option>
                    <option value="pix">Pix</option>
                    <option value="cash">Dinheiro</option>
                    <option value="credit_card">Cartão de crédito</option>
                    <option value="debit_card">Cartão de débito</option>
                    <option value="transfer">Transferência</option>
                  </Select>
                </Field>

                <Field label="Pago em" className="md:col-span-2">
                  <Input
                    name="paidAt"
                    type="datetime-local"
                    defaultValue={
                      currentSubscription.paid_at
                        ? new Date(currentSubscription.paid_at).toISOString().slice(0, 16)
                        : ''
                    }
                  />
                </Field>

                <Field label="Observações" className="md:col-span-2">
                  <Textarea name="notes" rows={3} defaultValue={currentSubscription.notes || ''} />
                </Field>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <SubmitButton>Salvar mensalidade</SubmitButton>
                </div>
              </form>

              <div className="flex flex-wrap gap-3">
                {currentSubscription.status !== 'paid' ? (
                  <form action={confirmSubscriptionPayment}>
                    <input type="hidden" name="subscriptionId" value={currentSubscription.id} />
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="amount" value={currentSubscription.amount} />
                    <input type="hidden" name="paymentMethod" value={currentSubscription.payment_method || 'pix'} />
                    <SubmitButton>Confirmar pagamento</SubmitButton>
                  </form>
                ) : (
                  <form action={markSubscriptionPending}>
                    <input type="hidden" name="subscriptionId" value={currentSubscription.id} />
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="dueDate" value={currentSubscription.due_date} />
                    <SecondaryButton type="submit">Voltar para pendente</SecondaryButton>
                  </form>
                )}

                <form action={deleteSubscriptionRecord}>
                  <input type="hidden" name="subscriptionId" value={currentSubscription.id} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <DangerButton type="submit">Excluir cobrança do mês</DangerButton>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-[var(--theme-surface-alt)] p-6">
              <p className="text-sm text-muted">
                Ainda não existe cobrança registrada para este mês.
              </p>

              <form action={ensureCurrentMonthSubscription} className="mt-4">
                <input type="hidden" name="businessId" value={business.id} />
                <SubmitButton>Gerar mensalidade do mês</SubmitButton>
              </form>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Criar cobrança manual" description="Use para registrar meses anteriores ou ajustes específicos.">
          <form action={createSubscriptionRecord} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="businessId" value={business.id} />

            <Field label="Mês">
              <Input name="referenceMonth" type="number" min={1} max={12} defaultValue={month} />
            </Field>

            <Field label="Ano">
              <Input name="referenceYear" type="number" defaultValue={year} />
            </Field>

            <Field label="Valor">
              <Input name="amount" defaultValue={SINGLE_PLAN_PRICE.toFixed(2).replace('.', ',')} />
            </Field>

            <Field label="Vencimento">
              <Input name="dueDate" type="date" defaultValue={`${year}-${String(month).padStart(2, '0')}-10`} />
            </Field>

            <Field label="Status">
              <Select name="status" defaultValue="pending">
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
                <option value="paid">Pago</option>
                <option value="waived">Isento</option>
              </Select>
            </Field>

            <Field label="Forma de pagamento">
              <Select name="paymentMethod" defaultValue="">
                <option value="">Não informado</option>
                <option value="pix">Pix</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Cartão de crédito</option>
                <option value="debit_card">Cartão de débito</option>
                <option value="transfer">Transferência</option>
              </Select>
            </Field>

            <Field label="Pago em" className="md:col-span-2">
              <Input name="paidAt" type="datetime-local" />
            </Field>

            <Field label="Observações" className="md:col-span-2">
              <Textarea name="notes" rows={3} placeholder="Ex.: cliente pediu mais prazo, cobrança manual, ajuste..." />
            </Field>

            <div className="md:col-span-2">
              <SubmitButton>Criar cobrança</SubmitButton>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Histórico de mensalidades" description="CRUD completo da assinatura desse cliente.">
          <div className="space-y-4">
            {subscriptionRows.length ? (
              subscriptionRows.map((item) => {
                const itemVisual = getBillingVisual(item);

                return (
                  <div key={item.id} className="rounded-2xl border border-border p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {String(item.reference_month).padStart(2, '0')}/{item.reference_year}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Vencimento: {formatDateBR(item.due_date)} • Valor: R$ {item.amount.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <StatusBadge status={itemVisual.tone}>{itemVisual.label}</StatusBadge>
                    </div>

                    <form action={updateSubscriptionRecord} className="grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="subscriptionId" value={item.id} />
                      <input type="hidden" name="businessId" value={business.id} />

                      <Field label="Mês">
                        <Input name="referenceMonth" type="number" min={1} max={12} defaultValue={item.reference_month} />
                      </Field>

                      <Field label="Ano">
                        <Input name="referenceYear" type="number" defaultValue={item.reference_year} />
                      </Field>

                      <Field label="Valor">
                        <Input name="amount" defaultValue={String(item.amount).replace('.', ',')} />
                      </Field>

                      <Field label="Vencimento">
                        <Input name="dueDate" type="date" defaultValue={item.due_date} />
                      </Field>

                      <Field label="Status">
                        <Select name="status" defaultValue={item.status}>
                          <option value="pending">Pendente</option>
                          <option value="overdue">Atrasado</option>
                          <option value="paid">Pago</option>
                          <option value="waived">Isento</option>
                        </Select>
                      </Field>

                      <Field label="Forma de pagamento">
                        <Select name="paymentMethod" defaultValue={item.payment_method || ''}>
                          <option value="">Não informado</option>
                          <option value="pix">Pix</option>
                          <option value="cash">Dinheiro</option>
                          <option value="credit_card">Cartão de crédito</option>
                          <option value="debit_card">Cartão de débito</option>
                          <option value="transfer">Transferência</option>
                        </Select>
                      </Field>

                      <Field label="Pago em" className="md:col-span-2">
                        <Input
                          name="paidAt"
                          type="datetime-local"
                          defaultValue={item.paid_at ? new Date(item.paid_at).toISOString().slice(0, 16) : ''}
                        />
                      </Field>

                      <Field label="Observações" className="md:col-span-2">
                        <Textarea name="notes" rows={2} defaultValue={item.notes || ''} />
                      </Field>

                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <SubmitButton>Salvar</SubmitButton>

                        {item.status !== 'paid' ? (
                          <form action={confirmSubscriptionPayment}>
                            <input type="hidden" name="subscriptionId" value={item.id} />
                            <input type="hidden" name="businessId" value={business.id} />
                            <input type="hidden" name="amount" value={item.amount} />
                            <input type="hidden" name="paymentMethod" value={item.payment_method || 'pix'} />
                            <SubmitButton>Confirmar pagamento</SubmitButton>
                          </form>
                        ) : (
                          <form action={markSubscriptionPending}>
                            <input type="hidden" name="subscriptionId" value={item.id} />
                            <input type="hidden" name="businessId" value={business.id} />
                            <input type="hidden" name="dueDate" value={item.due_date} />
                            <SecondaryButton type="submit">Voltar pendente</SecondaryButton>
                          </form>
                        )}

                        <form action={deleteSubscriptionRecord}>
                          <input type="hidden" name="subscriptionId" value={item.id} />
                          <input type="hidden" name="businessId" value={business.id} />
                          <DangerButton type="submit">Excluir</DangerButton>
                        </form>
                      </div>
                    </form>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">Ainda não existe histórico de mensalidades.</p>
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Últimos atendimentos" description="Atividade operacional recente do studio, sem mostrar valores financeiros.">
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
                        <p className="text-sm text-muted">
                          {item.service_name || 'Serviço'} • {formatDateBR(item.preferred_date)} às {item.preferred_time?.slice(0, 5)}
                        </p>
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
    </div>
  );
}
