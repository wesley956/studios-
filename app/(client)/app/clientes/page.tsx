import Link from 'next/link';
import { createCustomer, deleteCustomer, updateCustomer } from '@/actions/client-customers';
import { DangerButton, Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { currencyBRL, formatDateBR, getAppUrl, statusLabel } from '@/lib/utils';
import { birthdayMessage, buildWhatsappUrl, returnInviteMessage } from '@/lib/whatsapp';

const customerTagOptions = [
  { value: 'vip', label: 'VIP' },
  { value: 'recorrente', label: 'Recorrente' },
  { value: 'retorno', label: 'Retorno' },
  { value: 'sumida', label: 'Sumida' },
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'preferencial', label: 'Preferencial' }
];

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  birthday: string | null;
  notes: string | null;
  tags?: string[] | null;
  next_follow_up_date?: string | null;
  return_interval_days?: number | null;
  preferences?: string | null;
  restrictions?: string | null;
  created_at: string;
};

function daysBetweenToday(dateValue: string | null | undefined) {
  if (!dateValue) return null;
  const today = new Date();
  const target = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((target.getTime() - cleanToday.getTime()) / 86400000);
}

function isBirthdayThisMonth(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth();
}

export default async function ClientesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; filter?: string; success?: string; error?: string }>;
}) {
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() || '';
  const selectedFilter = params?.filter || '';
  const publicUrl = `${getAppUrl()}/${business.slug}`;

  let customersQuery = supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  if (query) {
    customersQuery = customersQuery.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const [{ data: customers }, { data: appointments }, { data: payments }] = await Promise.all([
    customersQuery,
    supabase
      .from('appointments')
      .select('customer_id, status, appointment_date')
      .eq('business_id', business.id)
      .order('appointment_date', { ascending: false }),
    supabase.from('payments').select('customer_id, amount, payment_status').eq('business_id', business.id)
  ]);

  async function handleCreateCustomer(formData: FormData): Promise<void> {
    'use server';
    await createCustomer(formData);
  }

  async function handleUpdateCustomer(formData: FormData): Promise<void> {
    'use server';
    await updateCustomer(formData);
  }

  async function handleDeleteCustomer(formData: FormData): Promise<void> {
    'use server';
    await deleteCustomer(formData);
  }

  const appointmentMap = new Map<string, number>();
  const lastVisitMap = new Map<string, string>();
  (appointments || []).forEach((item) => {
    if (!item.customer_id || item.status === 'cancelled') return;
    appointmentMap.set(item.customer_id, (appointmentMap.get(item.customer_id) || 0) + 1);
    if (!lastVisitMap.has(item.customer_id) && item.appointment_date) {
      lastVisitMap.set(item.customer_id, item.appointment_date);
    }
  });

  const paymentMap = new Map<string, number>();
  (payments || []).forEach((item) => {
    if (!item.customer_id || !['paid', 'partial'].includes(String(item.payment_status))) return;
    paymentMap.set(item.customer_id, (paymentMap.get(item.customer_id) || 0) + Number(item.amount || 0));
  });

  const customerRows = ((customers || []) as CustomerRow[]).filter((customer) => {
    const lastVisit = lastVisitMap.get(customer.id) || null;
    const daysSinceLastVisit = lastVisit ? Math.abs(daysBetweenToday(lastVisit) || 0) : null;
    const followUpDiff = daysBetweenToday(customer.next_follow_up_date || null);

    if (selectedFilter === 'retorno') return followUpDiff !== null && followUpDiff <= 7;
    if (selectedFilter === 'atrasado') return followUpDiff !== null && followUpDiff < 0;
    if (selectedFilter === 'sumidas') return daysSinceLastVisit !== null && daysSinceLastVisit >= 45;
    if (selectedFilter === 'aniversario') return isBirthdayThisMonth(customer.birthday);
    return true;
  });

  const birthdayCount = ((customers || []) as CustomerRow[]).filter((customer) => isBirthdayThisMonth(customer.birthday)).length;
  const followUpCount = ((customers || []) as CustomerRow[]).filter((customer) => {
    const diff = daysBetweenToday(customer.next_follow_up_date || null);
    return diff !== null && diff <= 7;
  }).length;
  const disappearedCount = ((customers || []) as CustomerRow[]).filter((customer) => {
    const lastVisit = lastVisitMap.get(customer.id) || null;
    const daysSinceLastVisit = lastVisit ? Math.abs(daysBetweenToday(lastVisit) || 0) : null;
    return daysSinceLastVisit !== null && daysSinceLastVisit >= 45;
  }).length;

  return (
    <div>
      <TopHeading
        title="Clientes"
        description="CRM simples para acompanhar histórico, retorno, aniversários, preferências e clientes que podem voltar a comprar."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/app/clientes/export" className="rounded-2xl border border-border bg-white px-5 py-3 text-sm font-medium">
              Exportar CSV
            </Link>
            <Link href="/app/clientes/relatorio" className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white">
              Relatório/PDF
            </Link>
          </div>
        }
      />

      {params?.success ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{params.success}</div>
      ) : null}
      {params?.error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{params.error}</div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-soft">
          <p className="text-sm text-muted">Total de clientes</p>
          <p className="mt-3 text-3xl font-semibold">{customers?.length || 0}</p>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-soft">
          <p className="text-sm text-muted">Retorno até 7 dias</p>
          <p className="mt-3 text-3xl font-semibold">{followUpCount}</p>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-soft">
          <p className="text-sm text-muted">Aniversários do mês</p>
          <p className="mt-3 text-3xl font-semibold">{birthdayCount}</p>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-soft">
          <p className="text-sm text-muted">Sem retorno há 45+ dias</p>
          <p className="mt-3 text-3xl font-semibold">{disappearedCount}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr,340px]">
        <SectionCard title="Buscar e filtrar" description="Pesquise por nome/telefone ou use os filtros de CRM.">
          <form className="grid gap-3 md:grid-cols-[1fr,220px,160px]">
            <Input name="q" defaultValue={query} placeholder="Ex.: Maria ou 1999..." />
            <Select name="filter" defaultValue={selectedFilter}>
              <option value="">Todos</option>
              <option value="retorno">Retorno próximo</option>
              <option value="atrasado">Retorno atrasado</option>
              <option value="sumidas">Sumidas 45+ dias</option>
              <option value="aniversario">Aniversário do mês</option>
            </Select>
            <SubmitButton>Aplicar</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="Link público" description="Use em bio, status e mensagens.">
          <div className="rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4 text-sm break-all">{publicUrl}</div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SectionCard title="Base de clientes" description="Abra um cliente para editar dados, tags, retorno e mensagens prontas.">
          <div className="space-y-4">
            {customerRows.length ? (
              customerRows.map((customer) => {
                const tags = Array.isArray(customer.tags) ? customer.tags : [];
                const lastVisit = lastVisitMap.get(customer.id) || null;
                const nextFollowUpDiff = daysBetweenToday(customer.next_follow_up_date || null);
                const shouldReturn = nextFollowUpDiff !== null && nextFollowUpDiff <= 7;
                const isLate = nextFollowUpDiff !== null && nextFollowUpDiff < 0;
                const revenue = paymentMap.get(customer.id) || 0;

                return (
                  <details key={customer.id} className="group rounded-[1.5rem] border border-border p-5 open:bg-[#FCFAF7]">
                    <summary className="flex cursor-pointer list-none flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium">{customer.full_name}</p>
                          <StatusBadge status="neutral">{appointmentMap.get(customer.id) || 0} atendimentos</StatusBadge>
                          {shouldReturn ? <StatusBadge status={isLate ? 'danger' : 'warning'}>{isLate ? 'Retorno atrasado' : 'Retorno próximo'}</StatusBadge> : null}
                          {isBirthdayThisMonth(customer.birthday) ? <StatusBadge status="success">Aniversário do mês</StatusBadge> : null}
                        </div>

                        <p className="mt-1 text-sm text-muted">{customer.phone}</p>
                        <p className="mt-2 text-sm text-muted">
                          Última visita: {lastVisit ? formatDateBR(lastVisit) : 'Sem histórico'} • Próximo retorno:{' '}
                          {customer.next_follow_up_date ? formatDateBR(customer.next_follow_up_date) : 'Não definido'} • Faturamento: {currencyBRL(revenue)}
                        </p>

                        {tags.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tags.map((tag) => <StatusBadge key={tag} status="dark">{statusLabel(tag)}</StatusBadge>)}
                          </div>
                        ) : null}

                        {customer.notes && <p className="mt-2 text-sm text-muted">{customer.notes}</p>}
                      </div>

                      <span className="text-sm text-primary group-open:hidden">Abrir</span>
                    </summary>

                    <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-2">
                      <a
                        href={buildWhatsappUrl(customer.phone, returnInviteMessage({ businessName: business.business_name, customerName: customer.full_name, publicUrl }))}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-border bg-white px-4 py-3 text-center text-sm font-medium transition hover:bg-primary-soft"
                      >
                        Mensagem de retorno
                      </a>
                      <a
                        href={buildWhatsappUrl(customer.phone, birthdayMessage({ businessName: business.business_name, customerName: customer.full_name }))}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-border bg-white px-4 py-3 text-center text-sm font-medium transition hover:bg-primary-soft"
                      >
                        Mensagem de aniversário
                      </a>
                    </div>

                    <form action={handleUpdateCustomer} className="mt-5 grid gap-4 border-t border-border pt-5">
                      <input type="hidden" name="customerId" value={customer.id} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Nome completo"><Input name="fullName" defaultValue={customer.full_name} required /></Field>
                        <Field label="Telefone"><Input name="phone" defaultValue={customer.phone} required /></Field>
                        <Field label="Aniversário"><Input name="birthday" type="date" defaultValue={customer.birthday || ''} /></Field>
                        <Field label="Próximo retorno"><Input name="nextFollowUpDate" type="date" defaultValue={customer.next_follow_up_date || ''} /></Field>
                        <Field label="Intervalo de retorno sugerido (dias)"><Input name="returnIntervalDays" type="number" min={1} defaultValue={customer.return_interval_days || 30} /></Field>
                        <Field label="Tags" className="md:col-span-2">
                          <div className="grid gap-3 rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4 sm:grid-cols-2 lg:grid-cols-3">
                            {customerTagOptions.map((option) => (
                              <label key={option.value} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" name="tags" value={option.value} defaultChecked={tags.includes(option.value)} />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        </Field>
                        <Field label="Preferências" className="md:col-span-2"><Textarea name="preferences" rows={3} defaultValue={customer.preferences || ''} /></Field>
                        <Field label="Cuidados/restrições" className="md:col-span-2"><Textarea name="restrictions" rows={3} defaultValue={customer.restrictions || ''} /></Field>
                        <Field label="Observações" className="md:col-span-2"><Textarea name="notes" rows={4} defaultValue={customer.notes || ''} /></Field>
                      </div>

                      <div className="flex flex-wrap gap-3"><SubmitButton>Salvar alterações</SubmitButton></div>
                    </form>

                    <form action={handleDeleteCustomer} className="mt-3">
                      <input type="hidden" name="customerId" value={customer.id} />
                      <DangerButton type="submit">Excluir cliente</DangerButton>
                    </form>
                  </details>
                );
              })
            ) : (
              <EmptyState title="Nenhuma cliente encontrada" description="Ajuste os filtros ou cadastre sua primeira cliente para começar o relacionamento." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Nova cliente" description="Adicione clientes manualmente e deixe a base pronta para vendas e retorno.">
          <form action={handleCreateCustomer} className="grid gap-4">
            <Field label="Nome completo"><Input name="fullName" required /></Field>
            <Field label="Telefone"><Input name="phone" required /></Field>
            <Field label="Aniversário"><Input name="birthday" type="date" /></Field>
            <Field label="Próximo retorno"><Input name="nextFollowUpDate" type="date" /></Field>
            <Field label="Intervalo de retorno sugerido (dias)"><Input name="returnIntervalDays" type="number" min={1} defaultValue={30} /></Field>
            <Field label="Tags">
              <div className="grid gap-3 rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4 sm:grid-cols-2">
                {customerTagOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="tags" value={option.value} />
                    {option.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Preferências"><Textarea name="preferences" rows={3} /></Field>
            <Field label="Cuidados/restrições"><Textarea name="restrictions" rows={3} /></Field>
            <Field label="Observações"><Textarea name="notes" rows={4} /></Field>
            <SubmitButton>Salvar cliente</SubmitButton>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
