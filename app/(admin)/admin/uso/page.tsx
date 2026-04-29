import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, StatCard, TopHeading } from '@/components/shared/shell';
import { formatDateTimeBR } from '@/lib/utils';

export default async function AdminUsoPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: businesses }, { data: services }, { data: requests }, { data: appointments }, { data: payments }, { data: auditLogs }] = await Promise.all([
    supabase.from('businesses').select('id, status'),
    supabase.from('services').select('business_id'),
    supabase.from('booking_requests').select('business_id'),
    supabase.from('appointments').select('business_id'),
    supabase.from('payments').select('business_id, amount'),
    supabase.from('audit_logs').select('*, businesses(business_name), profiles(full_name, email)').order('created_at', { ascending: false }).limit(20)
  ]);

  const uniqueBusinesses = new Set((businesses || []).map((item) => item.id));
  const withServices = new Set((services || []).map((item) => item.business_id));
  const withRequests = new Set((requests || []).map((item) => item.business_id));
  const withAppointments = new Set((appointments || []).map((item) => item.business_id));
  const withFinanceUsage = new Set((payments || []).filter((item) => Number(item.amount || 0) > 0).map((item) => item.business_id));

  const activeBusinesses = (businesses || []).filter((item) => item.status === 'active').length;
  const adoptionRate = uniqueBusinesses.size ? Math.round((withServices.size / uniqueBusinesses.size) * 100) : 0;
  const requestRate = uniqueBusinesses.size ? Math.round((withRequests.size / uniqueBusinesses.size) * 100) : 0;
  const financeActivationRate = uniqueBusinesses.size ? Math.round((withFinanceUsage.size / uniqueBusinesses.size) * 100) : 0;

  return (
    <div>
      <TopHeading
        title="Uso da plataforma"
        description="Aqui você acompanha adoção e ativação do produto. A leitura continua focada em uso do sistema, sem abrir o faturamento interno dos studios."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Negócios cadastrados" value={uniqueBusinesses.size} />
        <StatCard label="Clientes ativos" value={activeBusinesses} />
        <StatCard label="Com serviços" value={withServices.size} hint={`${adoptionRate}% da base`} />
        <StatCard label="Com solicitações" value={withRequests.size} hint={`${requestRate}% da base`} />
        <StatCard label="Com uso financeiro" value={withFinanceUsage.size} hint={`${financeActivationRate}% da base`} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <SectionCard title="Leitura prática" description="O que esses números sugerem sobre o produto hoje.">
          <ul className="space-y-3 text-sm text-muted">
            <li>• Se muitos clientes têm serviços, o onboarding está funcionando.</li>
            <li>• Se poucos recebem solicitações, a página pública ou a divulgação precisa de reforço.</li>
            <li>• Se há agenda ativa mas pouco uso financeiro, vale cobrar conclusão e registro de pagamento.</li>
            <li>• Quando o cliente está ativo, mas sem agenda, ele ainda não colocou o sistema no centro da operação.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Próximos focos" description="Melhorias valiosas para crescimento e retenção com o plano único.">
          <ul className="space-y-3 text-sm text-muted">
            <li>• Acompanhar trials sem serviços cadastrados e cobrar ativação.</li>
            <li>• Criar automação de onboarding para a primeira semana de uso.</li>
            <li>• Medir conversão de trial para ativo usando o preço fixo de R$ 69,90.</li>
            <li>• Destacar clientes com agenda, mas sem uso financeiro, para ação comercial.</li>
          </ul>
        </SectionCard>
      </div>


      <SectionCard className="mt-8" title="Auditoria recente" description="Últimas ações registradas no sistema para ajudar no suporte e investigação de mudanças.">
        <div className="space-y-3">
          {auditLogs?.length ? (
            auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4 text-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-text">{log.action}</p>
                    <p className="mt-1 text-muted">
                      {(log.businesses as { business_name?: string } | null)?.business_name || 'Sem negócio'} • {(log.profiles as { full_name?: string; email?: string } | null)?.full_name || (log.profiles as { email?: string } | null)?.email || 'Sistema'}
                    </p>
                  </div>
                  <span className="text-xs text-muted">{formatDateTimeBR(log.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
              A auditoria começa a aparecer depois que clientes, agendamentos e configurações forem alterados.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
