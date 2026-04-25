import { EmptyState, SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { currencyBRL, formatDateTimeBR, statusLabel } from '@/lib/utils';

function getPaymentBadge(status: string | null | undefined) {
  if (status === 'paid') return 'success';
  if (status === 'partial') return 'warning';
  if (status === 'cancelled' || status === 'refunded') return 'danger';
  return 'neutral';
}

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
    supabase
      .from('appointments')
      .select('final_price, paid_amount, payment_status, status')
      .eq('business_id', business.id)
  ]);

  const receivedPayments = (payments || []).filter(
    (item) => !['cancelled', 'refunded'].includes(String(item.payment_status)) && Number(item.amount || 0) > 0
  );

  const pendingAmount = (appointments || [])
    .filter((item) => !['cancelled', 'no_show'].includes(String(item.status)))
    .reduce<number>(
      (sum, item) => sum + Math.max(Number(item.final_price || 0) - Number(item.paid_amount || 0), 0),
      0
    );

  const totalReceived = receivedPayments.reduce<number>((sum, item) => sum + Number(item.amount || 0), 0);
  const ticketAverage = receivedPayments.length ? totalReceived / receivedPayments.length : 0;

  const methodTotals = new Map<string, number>();
  receivedPayments.forEach((item) => {
    const key = item.payment_method || 'indefinido';
    methodTotals.set(key, (methodTotals.get(key) || 0) + Number(item.amount || 0));
  });

  return (
    <div>
      <TopHeading
        title="Financeiro"
        description="Veja quanto entrou, o que ainda está pendente e como o dinheiro está chegando no seu studio."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recebido" value={currencyBRL(totalReceived)} tone="success" hint="Total realmente recebido" />
        <StatCard
          label="Pendente"
          value={currencyBRL(pendingAmount)}
          tone="warning"
          hint="Diferença entre o valor cobrado e o que já foi pago"
        />
        <StatCard label="Ticket médio" value={currencyBRL(ticketAverage)} hint="Média por recebimento lançado" />
        <StatCard label="Recebimentos" value={receivedPayments.length} hint="Lançamentos com valor recebido" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <SectionCard title="Filtros e composição" description="Compare pagamentos por status e forma de recebimento.">
          <form className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <select
                name="status"
                defaultValue={selectedStatus}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Todos</option>
                <option value="paid">Pago</option>
                <option value="partial">Parcial</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
                <option value="refunded">Estornado</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Forma</label>
              <select
                name="method"
                defaultValue={selectedMethod}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Todas</option>
                <option value="pix">Pix</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Crédito</option>
                <option value="debit_card">Débito</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button className="rounded-2xl bg-primary px-5 py-3 text-white transition hover:opacity-90">Aplicar filtros</button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {[...methodTotals.entries()].map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between rounded-2xl border border-border p-4">
                <span className="text-sm text-muted">{statusLabel(method)}</span>
                <strong>{currencyBRL(amount)}</strong>
              </div>
            ))}

            {!methodTotals.size ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                Ainda não há pagamentos suficientes para comparar formas de recebimento.
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Lançamentos" description="Tudo o que foi cobrado, recebido ou ainda está em aberto.">
          <div className="space-y-3">
            {payments?.length ? (
              payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {(payment.customers as { full_name?: string } | null)?.full_name || 'Cliente'}
                        </p>
                        <StatusBadge status={getPaymentBadge(payment.payment_status)}>
                          {statusLabel(payment.payment_status)}
                        </StatusBadge>
                      </div>

                      <p className="mt-1 text-sm text-muted">
                        {(payment.services as { name?: string } | null)?.name || 'Atendimento'}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDateTimeBR(payment.paid_at || payment.created_at)}
                      </p>
                      {payment.notes ? <p className="mt-2 text-sm text-muted">{payment.notes}</p> : null}
                    </div>

                    <div className="text-right">
                      <p className="font-medium">{currencyBRL(payment.amount || 0)}</p>
                      <p className="mt-1 text-xs text-muted">
                        Cobrança: {currencyBRL(payment.final_amount || 0)}
                      </p>
                      <p className="mt-1 text-xs uppercase text-muted">{statusLabel(payment.payment_method || '')}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Nenhum lançamento encontrado"
                description="Assim que você concluir atendimentos com pagamento, eles aparecerão aqui."
              />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
