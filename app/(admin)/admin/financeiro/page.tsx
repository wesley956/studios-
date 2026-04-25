import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, StatCard, TopHeading, StatusBadge } from '@/components/shared/shell';
import { currencyBRL, statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

export default async function AdminFinanceiroPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: businesses }, { data: services }, { data: appointments }, { data: requests }] = await Promise.all([
    supabase.from('businesses').select('id, business_name, status, created_at, profiles:owner_id(full_name,email)').order('created_at', { ascending: false }),
    supabase.from('services').select('business_id'),
    supabase.from('appointments').select('business_id'),
    supabase.from('booking_requests').select('business_id')
  ]);

  const businessesList = businesses || [];
  const activeCount = businessesList.filter((item) => item.status === 'active').length;
  const trialCount = businessesList.filter((item) => item.status === 'trial').length;
  const blockedCount = businessesList.filter((item) => item.status === 'blocked').length;

  const servicesMap = new Map<string, number>();
  const appointmentsMap = new Map<string, number>();
  const requestsMap = new Map<string, number>();

  (services || []).forEach((item) => {
    servicesMap.set(item.business_id, (servicesMap.get(item.business_id) || 0) + 1);
  });
  (appointments || []).forEach((item) => {
    appointmentsMap.set(item.business_id, (appointmentsMap.get(item.business_id) || 0) + 1);
  });
  (requests || []).forEach((item) => {
    requestsMap.set(item.business_id, (requestsMap.get(item.business_id) || 0) + 1);
  });

  const recurringRevenue = activeCount * SINGLE_PLAN_PRICE;
  const potentialRevenue = (activeCount + trialCount) * SINGLE_PLAN_PRICE;
  const totalBase = businessesList.length || 0;
  const conversionRate = totalBase ? Math.round((activeCount / totalBase) * 100) : 0;

  const attentionList = businessesList
    .map((item) => {
      const owner = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const serviceCount = servicesMap.get(item.id) || 0;
      const appointmentCount = appointmentsMap.get(item.id) || 0;
      const requestCount = requestsMap.get(item.id) || 0;
      const reasons = [
        item.status === 'blocked' ? 'bloqueado' : null,
        item.status === 'trial' && serviceCount === 0 ? 'trial sem serviços' : null,
        item.status === 'trial' && requestCount === 0 ? 'trial sem demanda' : null,
        item.status === 'active' && appointmentCount === 0 ? 'ativo sem uso da agenda' : null
      ].filter(Boolean);

      return {
        id: item.id,
        business_name: item.business_name,
        status: item.status,
        owner,
        serviceCount,
        appointmentCount,
        requestCount,
        reasons
      };
    })
    .filter((item) => item.reasons.length > 0)
    .slice(0, 8);

  return (
    <div>
      <TopHeading
        title="Assinaturas da plataforma"
        description="Esta visão mostra apenas a receita estimada do seu SaaS e a saúde comercial da base. Ela não exibe quanto cada studio fatura com as próprias clientes."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR estimado" value={currencyBRL(recurringRevenue)} hint={`Clientes ativos × ${currencyBRL(SINGLE_PLAN_PRICE)}`} tone="success" />
        <StatCard label="Potencial imediato" value={currencyBRL(potentialRevenue)} hint="Ativos + trials" tone="warning" />
        <StatCard label="Base total" value={totalBase} hint={`Conversão atual: ${conversionRate}%`} />
        <StatCard label="Clientes bloqueados" value={blockedCount} hint="Pontos de atenção comercial" tone="dark" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <SectionCard title="Plano comercial" description="Resumo do posicionamento atual da sua oferta.">
          <div className="space-y-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="font-medium">{SINGLE_PLAN_LABEL}</p>
              <p className="mt-1 text-sm text-muted">Oferta simplificada para facilitar a venda e reduzir dúvidas na hora de fechar o cliente.</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted">Valor mensal</p>
              <p className="mt-2 text-2xl font-semibold">{currencyBRL(SINGLE_PLAN_PRICE)}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted">Leitura comercial</p>
              <ul className="mt-2 space-y-2 text-sm text-muted">
                <li>• Ativo = assinatura valendo.</li>
                <li>• Trial = potencial real de fechamento.</li>
                <li>• Bloqueado = cliente para recuperar ou encerrar.</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Clientes que exigem ação" description="Estes negócios pedem acompanhamento seu para converter, ativar ou recuperar.">
          <div className="space-y-3">
            {attentionList.length ? (
              attentionList.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{item.business_name}</p>
                      <p className="text-sm text-muted">{item.owner?.full_name || item.owner?.email || 'Sem responsável'}</p>
                    </div>
                    <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>
                      {statusLabel(item.status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    {item.reasons.map((reason) => (
                      <span key={reason} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                        {reason}
                      </span>
                    ))}
                    <span className="rounded-full border border-border px-3 py-1">Serviços {item.serviceCount}</span>
                    <span className="rounded-full border border-border px-3 py-1">Solicitações {item.requestCount}</span>
                    <span className="rounded-full border border-border px-3 py-1">Agenda {item.appointmentCount}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Nenhum cliente crítico neste momento.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
