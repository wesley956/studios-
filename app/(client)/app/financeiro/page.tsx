import { SectionCard, StatCard, TopHeading, EmptyState, StatusBadge } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { currencyBRL, formatDateTimeBR, statusLabel } from '@/lib/utils';

export default async function FinanceiroPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; method?: string }>;
}) {
  await requireClientOwner();
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const selectedStatus = params?.status || '';
  const selectedMethod = params?.method || '';

  let paymentsQuery = supabase
    .from('payments')
    .select('*, customers(full_name), services(name)')
    .eq('business_id', business.id)
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (selectedStatus) paymentsQuery = paymentsQuery.eq('payment_status', selectedStatus);
  if (selectedMethod) paymentsQuery = paymentsQuery.eq('payment_method', selectedMethod);

  const [{ data: payments }, { data: appointments }] = await Promise.all([
    paymentsQuery,
    supabase.from('appointments').select('final_price, payment_status, status').eq('business_id', business.id)
  ]);

  const paid = (payments || []).filter((item) => item.payment_status === 'paid');
  const pendingAmount = (appointments || [])
    .filter((item) => item.status !== 'cancelled' && item.payment_status !== 'paid')
    .reduce((sum, item) => sum + Number(item.final_price || 0), 0);
  const totalReceived = paid.reduce((sum, item) => sum + Number(item.final_amount || 0), 0);
  const ticketAverage = paid.length ? totalReceived / paid.length : 0;

  const methodTotals = new Map<string, number>();
  paid.forEach((item) => {
    const key = item.payment_method || 'indefinido';
    methodTotals.set(key, (methodTotals.get(key) || 0) + Number(item.final_amount || 0));
  });

  return (
    <div>
      <TopHeading title="Financeiro" description="Veja quanto entrou, o que ainda está pendente e como o dinheiro está chegando no seu studio." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recebido" value={currencyBRL(totalReceived)} tone="success" hint="Total pago nos lançamentos visíveis" />
        <StatCard label="Pendente" value={currencyBRL(pendingAmount)} tone="warning" hint="Atendimentos concluídos ou confirmados sem quitação total" />
        <StatCard label="Ticket médio" value={currencyBRL(ticketAverage)} hint="Média por pagamento registrado" />
        <StatCard label="Pagamentos" value={paid.length} hint="Lançamentos com status pago" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <SectionCard title="Filtros e composição" description="Compare pagamentos por status e forma de recebimento.">
          <form className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <select name="status" defaultValue={selectedStatus} className="w-full rounded-2xl border border-border bg-white px-4 py-3">
                <option value="">Todos</option>
                <option value="paid">Pago</option>
                <option value="partial">Parcial</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Forma</label>
              <select name="method" defaultValue={selectedMethod} className="w-full rounded-2xl border border-border bg-white px-4 py-3">
                <option value="">Todas</option>
                <option value="pix">Pix</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Crédito</option>
                <option value="debit_card">Débito</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
            <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-white md:col-span-2">Aplicar filtros</button>
          </form>

          <div className="mt-6 grid gap-3">
            {[...methodTotals.entries()].map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between rounded-2xl bg-[#FBF7F3] px-4 py-3 text-sm">
                <span>{statusLabel(method)}</span>
                <span className="font-medium">{currencyBRL(amount)}</span>
              </div>
            ))}
            {!methodTotals.size && <p className="text-sm text-muted">Ainda não há pagamentos suficientes para comparar formas de recebimento.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Lançamentos" description="Histórico financeiro com cliente, serviço, forma de pagamento e status.">
          <div className="space-y-3">
            {payments?.length ? payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium">{(payment.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</p>
                      <StatusBadge status={payment.payment_status === 'paid' ? 'success' : payment.payment_status === 'partial' ? 'warning' : 'danger'}>
                        {statusLabel(payment.payment_status)}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{(payment.services as { name?: string } | null)?.name || 'Atendimento'}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTimeBR(payment.paid_at || payment.created_at)}</p>
                    {payment.notes && <p className="mt-2 text-sm text-muted">{payment.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currencyBRL(payment.final_amount)}</p>
                    <p className="mt-1 text-xs uppercase text-muted">{statusLabel(payment.payment_method || '')}</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState title="Sem lançamentos financeiros" description="Conclua um atendimento na agenda para começar a gerar pagamentos aqui." />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
