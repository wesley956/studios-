import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, StatCard, TopHeading, StatusBadge } from '@/components/shared/shell';
import { currencyBRL, statusLabel } from '@/lib/utils';

export default async function AdminFinanceiroPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: payments }, { data: businesses }] = await Promise.all([
    supabase.from('payments').select('business_id, final_amount, payment_status, payment_method, businesses:business_id(business_name)').order('paid_at', { ascending: false }).limit(100),
    supabase.from('businesses').select('plan_name')
  ]);

  const paid = (payments || []).filter((item) => item.payment_status === 'paid');
  const totalRevenue = paid.reduce((sum, item) => sum + Number(item.final_amount || 0), 0);
  const planMap = new Map<string, number>();
  (businesses || []).forEach((item) => planMap.set(item.plan_name, (planMap.get(item.plan_name) || 0) + 1));

  return (
    <div>
      <TopHeading title="Financeiro da plataforma" description="Acompanhe receita registrada pelos studios e distribuição atual dos planos." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Receita registrada" value={currencyBRL(totalRevenue)} tone="success" />
        <StatCard label="Pagamentos pagos" value={paid.length} />
        <StatCard label="Planos ativos na base" value={[...planMap.values()].reduce((sum, value) => sum + value, 0)} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <SectionCard title="Distribuição por plano" description="Base atual de clientes por plano contratado.">
          <div className="space-y-3">
            {[...planMap.entries()].map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between rounded-2xl border border-border p-4">
                <span className="font-medium">{plan}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Pagamentos recentes" description="Últimos registros lançados pelos clientes no sistema.">
          <div className="space-y-3">
            {(payments || []).map((item, index) => (
              <div key={`${item.business_id}-${index}`} className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <p className="font-medium">{(Array.isArray(item.businesses) ? item.businesses[0] : item.businesses as { business_name?: string } | null)?.business_name || 'Studio'}</p>
                  <p className="text-sm text-muted">{statusLabel(item.payment_method || '')}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={item.payment_status === 'paid' ? 'success' : 'warning'}>{statusLabel(item.payment_status)}</StatusBadge>
                  <p className="mt-2 font-medium">{currencyBRL(item.final_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
