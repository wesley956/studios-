import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, StatCard, TopHeading } from '@/components/shared/shell';

export default async function AdminUsoPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: businesses }, { data: services }, { data: requests }, { data: appointments }, { data: payments }] = await Promise.all([
    supabase.from('businesses').select('id'),
    supabase.from('services').select('business_id'),
    supabase.from('booking_requests').select('business_id'),
    supabase.from('appointments').select('business_id'),
    supabase.from('payments').select('business_id')
  ]);

  const uniqueBusinesses = new Set((businesses || []).map((item) => item.id));
  const withServices = new Set((services || []).map((item) => item.business_id));
  const withRequests = new Set((requests || []).map((item) => item.business_id));
  const withAppointments = new Set((appointments || []).map((item) => item.business_id));
  const withPayments = new Set((payments || []).map((item) => item.business_id));

  return (
    <div>
      <TopHeading title="Uso da plataforma" description="Entenda o nível de adoção do produto e quais áreas estão sendo mais usadas pelos clientes." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Negócios cadastrados" value={uniqueBusinesses.size} />
        <StatCard label="Negócios com serviços" value={withServices.size} />
        <StatCard label="Negócios com solicitações" value={withRequests.size} />
        <StatCard label="Negócios com agenda" value={withAppointments.size} />
        <StatCard label="Negócios com pagamentos" value={withPayments.size} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <SectionCard title="Leitura prática" description="O que esses números sugerem sobre o produto.">
          <ul className="space-y-3 text-sm text-muted">
            <li>• Se muitos clientes têm serviços, o onboarding está funcionando.</li>
            <li>• Se poucos recebem solicitações, a página pública ou divulgação precisa de reforço.</li>
            <li>• Se há agenda ativa mas pouco financeiro, vale olhar conclusão e registro de pagamento.</li>
            <li>• Com esse painel você consegue enxergar adoção real, não só cadastros.</li>
          </ul>
        </SectionCard>
        <SectionCard title="Próximos focos" description="Melhorias valiosas para crescimento e retenção.">
          <ul className="space-y-3 text-sm text-muted">
            <li>• Evoluir relatórios exportáveis para operações maiores.</li>
            <li>• Adicionar comunicação automática por WhatsApp.</li>
            <li>• Medir retenção por mês e clientes em risco.</li>
            <li>• Criar automações de onboarding para novos studios.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
