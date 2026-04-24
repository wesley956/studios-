import { createCustomer, deleteCustomer, updateCustomer } from '@/actions/client-customers';
import { DangerButton, Field, Input, SubmitButton, Textarea } from '@/components/shared/forms';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { currencyBRL, formatDateBR } from '@/lib/utils';

export default async function ClientesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() || '';

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
    supabase.from('appointments').select('customer_id, status').eq('business_id', business.id),
    supabase.from('payments').select('customer_id, final_amount, payment_status').eq('business_id', business.id)
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
  (appointments || []).forEach((item) => {
    if (!item.customer_id || item.status === 'cancelled') return;
    appointmentMap.set(item.customer_id, (appointmentMap.get(item.customer_id) || 0) + 1);
  });

  const paymentMap = new Map<string, number>();
  (payments || []).forEach((item) => {
    if (!item.customer_id || item.payment_status !== 'paid') return;
    paymentMap.set(item.customer_id, (paymentMap.get(item.customer_id) || 0) + Number(item.final_amount || 0));
  });

  return (
    <div>
      <TopHeading title="Clientes" description="Cadastre, pesquise, edite e acompanhe o histórico de relacionamento com cada cliente." />
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr,340px]">
        <SectionCard title="Buscar cliente" description="Pesquise por nome ou telefone.">
          <form className="flex flex-col gap-3 md:flex-row">
            <Input name="q" defaultValue={query} placeholder="Ex.: Maria ou 1999..." />
            <SubmitButton className="md:min-w-[160px]">Pesquisar</SubmitButton>
          </form>
        </SectionCard>
        <SectionCard title="Resumo" description="Visão rápida da sua base cadastrada.">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[#FBF7F3] p-4"><p className="text-muted">Total</p><p className="mt-1 text-2xl font-semibold">{customers?.length || 0}</p></div>
            <div className="rounded-2xl bg-[#FBF7F3] p-4"><p className="text-muted">Com histórico</p><p className="mt-1 text-2xl font-semibold">{[...appointmentMap.values()].filter(Boolean).length}</p></div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SectionCard title="Base de clientes" description="Mantenha telefone, aniversário e observações sempre atualizados.">
          <div className="space-y-4">
            {customers?.length ? customers.map((customer) => (
              <details key={customer.id} className="group rounded-[1.5rem] border border-border p-5 open:bg-[#FCFAF7]">
                <summary className="flex cursor-pointer list-none flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium">{customer.full_name}</p>
                      <StatusBadge status="neutral">{appointmentMap.get(customer.id) || 0} atendimentos</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{customer.phone}</p>
                    <p className="mt-2 text-sm text-muted">
                      Aniversário: {customer.birthday ? formatDateBR(customer.birthday) : 'Não informado'} • Faturamento: {currencyBRL(paymentMap.get(customer.id) || 0)}
                    </p>
                    {customer.notes && <p className="mt-2 text-sm text-muted">{customer.notes}</p>}
                  </div>
                  <span className="text-sm text-primary group-open:hidden">Editar</span>
                </summary>

                <form action={handleUpdateCustomer} className="mt-5 grid gap-4 border-t border-border pt-5">
                  <input type="hidden" name="customerId" value={customer.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nome completo"><Input name="fullName" defaultValue={customer.full_name} /></Field>
                    <Field label="Telefone"><Input name="phone" defaultValue={customer.phone} /></Field>
                    <Field label="Aniversário"><Input name="birthday" type="date" defaultValue={customer.birthday || ''} /></Field>
                    <Field label="Observações" className="md:col-span-2"><Textarea name="notes" rows={4} defaultValue={customer.notes || ''} /></Field>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <SubmitButton>Salvar alterações</SubmitButton>
                  </div>
                </form>

                <form action={handleDeleteCustomer} className="mt-3">
                  <input type="hidden" name="customerId" value={customer.id} />
                  <DangerButton type="submit">Excluir cliente</DangerButton>
                </form>
              </details>
            )) : <EmptyState title="Nenhuma cliente cadastrada" description="Cadastre sua primeira cliente para começar a organizar o relacionamento." />}
          </div>
        </SectionCard>

        <SectionCard title="Nova cliente" description="Adicione clientes manualmente e deixe a base pronta para vendas e retorno.">
          <form action={handleCreateCustomer} className="grid gap-4">
            <Field label="Nome completo"><Input name="fullName" /></Field>
            <Field label="Telefone"><Input name="phone" /></Field>
            <Field label="Aniversário"><Input name="birthday" type="date" /></Field>
            <Field label="Observações"><Textarea name="notes" rows={4} /></Field>
            <SubmitButton>Salvar cliente</SubmitButton>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
