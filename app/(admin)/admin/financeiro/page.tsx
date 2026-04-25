import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, StatCard, TopHeading, StatusBadge } from '@/components/shared/shell';
import { currencyBRL, statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

export default async function AdminFinanceiroPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: payments }, { count: activeCount }, { count: trialCount }, { count: blockedCount }] = await Promise.all([
    supabase
      .from('payments')
      .select('business_id, amount, final_amount, payment_status, payment_method, businesses:business_id(business_name)')
      .order('paid_at', { ascending: false })
      .limit(100),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'blocked')
  ]);

  const receivedPayments = (payments || []).filter((item) => ['paid', 'partial'].includes(String(item.payment_status)) && Number(item.amount || 0) > 0);
  const totalRevenue = receivedPayments.reduce<number>((sum, item) => sum + Number(item.amount || 0), 0);
  const totalBilled = receivedPayments.reduce<number>((sum, item) => sum + Number(item.final_amount || 0), 0);
  const pendingFromReceived = Math.max(totalBilled - totalRevenue, 0);
  const recurringRevenue = Number(activeCount || 0) * SINGLE_PLAN_PRICE;
  const potentialRevenue = Number((activeCount || 0) + (trialCount || 0)) * SINGLE_PLAN_PRICE;

  return (
    <div>
      <TopHeading title="Financeiro da plataforma" description="Leia receita real, MRR do plano único e a diferença entre o que os studios cobraram e o que realmente receberam." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receita registrada" value={currencyBRL(totalRevenue)} tone="success" hint="Dinheiro efetivamente recebido pelos studios" />
        <StatCard label="Cobrado no sistema" value={currencyBRL(totalBilled)} hint="Soma dos valores finais lançados" />
        <StatCard label="MRR do plano único" value={currencyBRL(recurringRevenue)} hint={`Ativos × ${currencyBRL(SINGLE_PLAN_PRICE)}`} />
        <StatCard label="Potencial com trials" value={currencyBRL(potentialRevenue)} hint={`Ativos + teste × ${currencyBRL(SINGLE_PLAN_PRICE)}`} tone="warning" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <StatCard label="Clientes ativos" value={activeCount || 0} />
        <StatCard label="Clientes em teste" value={trialCount || 0} />
        <StatCard label="Clientes bloqueados" value={blockedCount || 0} tone="dark" hint={`Diferença cobrado x recebido: ${currencyBRL(pendingFromReceived)}`} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <SectionCard title="Plano comercial" description="Resumo do posicionamento atual da sua oferta.">
          <div className="space-y-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="font-medium">{SINGLE_PLAN_LABEL}</p>
              <p className="mt-1 text-sm text-muted">Oferta simplificada para facilitar a venda e reduzir dúvida do cliente.</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted">Valor mensal</p>
              <p className="mt-2 text-2xl font-semibold">{currencyBRL(SINGLE_PLAN_PRICE)}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted">Leitura prática</p>
              <ul className="mt-2 space-y-2 text-sm text-muted">
                <li>• Ativo = receita recorrente imediata.</li>
                <li>• Trial = potencial claro de conversão.</li>
                <li>• Bloqueado = ponto de atenção comercial.</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pagamentos recentes" description="Últimos registros lançados pelos clientes no sistema.">
          <div className="space-y-3">
            {(payments || []).length ? (
              (payments || []).map((item, index) => (
                <div key={`${item.business_id}-${index}`} className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-medium">{(Array.isArray(item.businesses) ? item.businesses[0] : (item.businesses as { business_name?: string } | null))?.business_name || 'Studio'}</p>
                    <p className="text-sm text-muted">{statusLabel(item.payment_method || '')}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.payment_status === 'paid' ? 'success' : item.payment_status === 'partial' ? 'warning' : 'dark'}>
                      {statusLabel(item.payment_status)}
                    </StatusBadge>
                    <p className="mt-2 font-medium">{currencyBRL(item.amount || 0)}</p>
                    <p className="mt-1 text-xs text-muted">Cobrado: {currencyBRL(item.final_amount || 0)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Ainda não há pagamentos registrados.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
