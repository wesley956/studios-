import Link from 'next/link';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardMetrics } from '@/lib/metrics';
import { currencyBRL, formatDateBR, statusLabel } from '@/lib/utils';

export default async function AdminDashboard() {
  await requireAdmin();
  const { summary, latestBusinesses, inactiveBusinesses, topBusinesses } = await getAdminDashboardMetrics();

  return (
    <div>
      <TopHeading title="Dashboard Admin" description="Tenha visão financeira, crescimento e saúde da plataforma em um único painel." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes na plataforma" value={summary.businessesCount} tone="dark" hint={`${summary.ownersCount} donas cadastradas`} />
        <StatCard label="Ativos" value={summary.activeCount} tone="success" hint={`${summary.trialCount} em teste`} />
        <StatCard label="Bloqueados" value={summary.blockedCount} tone={summary.blockedCount ? 'warning' : 'default'} hint="Clientes que exigem atenção" />
        <StatCard label="Receita paga no mês" value={currencyBRL(summary.monthlyRevenue)} tone="success" hint={`Hoje: ${currencyBRL(summary.dailyRevenue)}`} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard title="Clientes em destaque" description="Quem mais movimenta receita dentro da plataforma." action={<Link href="/admin/clientes" className="text-sm text-primary">Ver todos</Link>}>
          <div className="space-y-3">
            {topBusinesses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{item.business_name}</p>
                    <p className="text-sm text-muted">{item.owner?.full_name || item.owner?.email || 'Sem responsável'}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>{statusLabel(item.status)}</StatusBadge>
                    <p className="mt-2 text-sm font-medium">{currencyBRL(item.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Precisa de atenção" description="Clientes com baixa movimentação ou ainda em fase inicial.">
          <div className="space-y-3">
            {inactiveBusinesses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.business_name}</p>
                    <p className="text-sm text-muted">Plano {item.plan_name}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.status === 'blocked' ? 'danger' : 'warning'}>{statusLabel(item.status)}</StatusBadge>
                    <p className="mt-2 text-sm text-muted">{currencyBRL(item.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard title="Últimos clientes criados" description="Novos studios entrando na plataforma.">
          <div className="space-y-3">
            {latestBusinesses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.business_name}</p>
                    <p className="text-sm text-muted">{item.city || 'Sem cidade'} • criado em {formatDateBR(item.created_at?.slice(0, 10))}</p>
                  </div>
                  <Link href={`/admin/clientes/${item.id}`} className="text-sm text-primary">Abrir</Link>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Atalhos rápidos" description="As ações que mais importam para operar a plataforma.">
          <div className="grid gap-3">
            <Link href="/admin/clientes/novo" className="rounded-2xl bg-primary px-5 py-4 text-white">Criar novo cliente</Link>
            <Link href="/admin/clientes" className="rounded-2xl border border-border bg-white px-5 py-4">Gerenciar base de clientes</Link>
            <Link href="/admin/financeiro" className="rounded-2xl border border-border bg-white px-5 py-4">Abrir visão financeira</Link>
            <Link href="/admin/uso" className="rounded-2xl border border-border bg-white px-5 py-4">Ver uso da plataforma</Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
