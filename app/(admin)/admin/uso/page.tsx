import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, StatCard, TopHeading } from '@/components/shared/shell';

export default async function AdminUsoPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: businesses }, { data: services }, { data: requests }, { data: appointments }, { data: payments }] = await Promise.all([
    supabase.from('businesses').select('id, status'),
    supabase.from('services').select('business_id'),
    supabase.from('booking_requests').select('business_id'),
    supabase.from('appointments').select('business_id'),
    supabase.from('payments').select('business_id, amount')
  ]);

  const uniqueBusinesses = new Set((businesses || []).map((item) => item.id));
  const withServices = new Set((services || []).map((item) => item.business_id));
  const withRequests = new Set((requests || []).map((item) => item.business_id));
  const withAppointments = new Set((appointments || []).map((item) => item.business_id));
  const withPayments = new Set((payments || []).filter((item) => Number(item.amount || 0) > 0).map((item) => item.business_id));

  const activeBusinesses = (businesses || []).filter((item) => item.status === 'active').length;
  const adoptionRate = uniqueBusinesses.size ? Math.round((withServices.size / uniqueBusinesses.size) * 100) : 0;
  const paymentActivationRate = uniqueBusinesses.size ? Math.round((withPayments.size / uniqueBusinesses.size) * 100) : 0;

  return (
    <div>
      <TopHeading title="Uso da plataforma" description="Entenda o nível de adoção do produto e onde insistir para ativar clientes e gerar retenção." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Negócios cadastrados" value={uniqueBusinesses.size} />
        <StatCard label="Clientes ativos" value={activeBusinesses} />
        <StatCard label="Com serviços" value={withServices.size} hint={`${adoptionRate}% da base`} />
        <StatCard label="Com agenda" value={withAppointments.size} />
        <StatCard label="Com pagamentos" value={withPayments.size} hint={`${paymentActivationRate}% da base`} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <SectionCard title="Leitura prática" description="O que esses números sugerem sobre o produto hoje.">
          <ul className="space-y-3 text-sm text-muted">
            <li>• Se muitos clientes têm serviços, o onboarding está funcionando.</li>
            <li>• Se poucos recebem solicitações, a página pública ou a divulgação precisa de reforço.</li>
            <li>• Se há agenda ativa mas pouco financeiro, vale cobrar conclusão e registro de pagamento.</li>
            <li>• Quando o cliente está ativo, mas não tem pagamentos, ele ainda não enxergou valor total do sistema.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Próximos focos" description="Melhorias valiosas para crescimento e retenção com o plano único.">
          <ul className="space-y-3 text-sm text-muted">
            <li>• Acompanhar trials sem serviços cadastrados e cobrar ativação.</li>
            <li>• Criar automação de onboarding para a primeira semana de uso.</li>
            <li>• Medir conversão de trial para ativo usando o preço fixo de R$ 69,90.</li>
            <li>• Destacar clientes com agenda, mas sem financeiro, para ação comercial.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
