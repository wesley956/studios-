import Link from 'next/link';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardMetrics } from '@/lib/metrics';
import { currencyBRL, formatDateBR, statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

export default async function AdminDashboard() {
  await requireAdmin();
  const { summary, latestBusinesses, inactiveBusinesses, topBusinesses } = await getAdminDashboardMetrics();

  return (
    <div>
      <TopHeading
        title="Central de controle"
        description="Acompanhe crescimento, receita, adoção e clientes que precisam de atenção. Agora o produto trabalha com um único plano comercial."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/clientes/novo" className="rounded-2xl bg-primary px-5 py-3 text-white transition hover:opacity-90">
              Criar novo cliente
            </Link>
            <Link href="/admin/clientes" className="rounded-2xl border border-border bg-white px-5 py-3 transition hover:bg-primary-soft">
              Gerenciar clientes
            </Link>
          </div>
        }
      />

      <div className="mb-6 rounded-[1.5rem] border border-primary/15 bg-primary-soft p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Modelo comercial atual</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-2xl font-serif">{SINGLE_PLAN_LABEL}</h3>
            <p className="mt-1 text-sm text-muted">Preço definido: {currencyBRL(SINGLE_PLAN_PRICE)}/mês. Sem comparação de planos na venda.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white p-4">
              <p className="text-sm text-muted">MRR estimado</p>
              <p className="mt-2 text-2xl font-semibold">{currencyBRL(summary.recurringRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white p-4">
              <p className="text-sm text-muted">Potencial com trials</p>
              <p className="mt-2 text-2xl font-semibold">{currencyBRL(summary.potentialRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes ativos" value={summary.activeCount} hint="Pagantes liberados" tone="success" />
        <StatCard label="Clientes em teste" value={summary.trialCount} hint="Potencial de conversão" tone="warning" />
        <StatCard label="Clientes bloqueados" value={summary.blockedCount} hint="Precisam de ação" tone="dark" />
        <StatCard label="Receita do mês" value={currencyBRL(summary.monthlyRevenue)} hint={`Hoje: ${currencyBRL(summary.dailyRevenue)}`} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Negócios na base" value={summary.businessesCount} hint={`Donas cadastradas: ${summary.ownersCount}`} />
        <StatCard label="Com serviços" value={summary.businessesWithServices} hint="Onboarding andando" />
        <StatCard label="Com solicitações" value={summary.businessesWithRequests} hint="Página pública gerando demanda" />
        <StatCard label="Com pagamentos" value={summary.businessesWithPayments} hint="Financeiro ativo" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard
          title="Top clientes por receita"
          description="Quem mais movimenta dinheiro dentro da plataforma hoje."
          action={<Link href="/admin/clientes" className="text-sm font-medium text-primary">Ver todos</Link>}
        >
          <div className="space-y-3">
            {topBusinesses.length ? (
              topBusinesses.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{item.business_name}</p>
                    <p className="text-sm text-muted">{item.owner?.full_name || item.owner?.email || 'Sem responsável'}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>
                      {statusLabel(item.status)}
                    </StatusBadge>
                    <p className="mt-2 text-sm font-medium">{currencyBRL(item.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Sem movimentação suficiente ainda.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Clientes sem receita" description="Negócios que já precisam de acompanhamento mais próximo.">
          <div className="space-y-3">
            {inactiveBusinesses.length ? (
              inactiveBusinesses.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-medium">{item.business_name}</p>
                    <p className="text-sm text-muted">{SINGLE_PLAN_LABEL}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>
                      {statusLabel(item.status)}
                    </StatusBadge>
                    <p className="mt-2 text-sm font-medium">{currencyBRL(item.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Todos os clientes já têm alguma movimentação.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SectionCard title="Últimos clientes criados" description="Veja rapidamente quem entrou na base recentemente.">
          <div className="space-y-3">
            {latestBusinesses.length ? (
              latestBusinesses.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-medium">{item.business_name}</p>
                    <p className="text-sm text-muted">{item.city || 'Sem cidade'} • criado em {formatDateBR(item.created_at?.slice(0, 10))}</p>
                  </div>
                  <Link href={`/admin/clientes/${item.id}`} className="text-sm font-medium text-primary">
                    Abrir
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Nenhum cliente criado ainda.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Ações rápidas" description="Atalhos para tocar a operação comercial e acompanhar saúde da plataforma.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/clientes/novo" className="rounded-2xl border border-border bg-white p-4 transition hover:bg-primary-soft">
              <p className="font-medium">Novo cliente</p>
              <p className="mt-1 text-sm text-muted">Crie acesso, negócio e onboarding inicial.</p>
            </Link>
            <Link href="/admin/clientes" className="rounded-2xl border border-border bg-white p-4 transition hover:bg-primary-soft">
              <p className="font-medium">Base de clientes</p>
              <p className="mt-1 text-sm text-muted">Busque, filtre e acompanhe receita por studio.</p>
            </Link>
            <Link href="/admin/financeiro" className="rounded-2xl border border-border bg-white p-4 transition hover:bg-primary-soft">
              <p className="font-medium">Financeiro</p>
              <p className="mt-1 text-sm text-muted">Receita real da operação e MRR do plano único.</p>
            </Link>
            <Link href="/admin/uso" className="rounded-2xl border border-border bg-white p-4 transition hover:bg-primary-soft">
              <p className="font-medium">Uso da plataforma</p>
              <p className="mt-1 text-sm text-muted">Veja adoção, gargalos e onde cobrar ativação.</p>
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
