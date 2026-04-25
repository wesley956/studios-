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
        description="Acompanhe a saúde da plataforma sem expor o faturamento interno dos studios. Aqui você enxerga uso, atividade e assinatura do seu sistema."
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
            <p className="mt-1 text-sm text-muted">Preço definido: {currencyBRL(SINGLE_PLAN_PRICE)}/mês. O admin acompanha assinatura e uso da plataforma, não o caixa do studio.</p>
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
        <StatCard label="Clientes ativos" value={summary.activeCount} hint="Assinatura liberada" tone="success" />
        <StatCard label="Clientes em teste" value={summary.trialCount} hint="Potencial de conversão" tone="warning" />
        <StatCard label="Clientes bloqueados" value={summary.blockedCount} hint="Precisam de ação" tone="dark" />
        <StatCard label="MRR estimado" value={currencyBRL(summary.recurringRevenue)} hint={`Plano único de ${currencyBRL(SINGLE_PLAN_PRICE)}`} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Negócios na base" value={summary.businessesCount} hint={`Donas cadastradas: ${summary.ownersCount}`} />
        <StatCard label="Com serviços" value={summary.businessesWithServices} hint="Onboarding funcionando" />
        <StatCard label="Com agenda" value={summary.businessesWithAppointments} hint="Uso operacional real" />
        <StatCard label="Página pronta" value={summary.publicReadyCount} hint={`Precisam de atenção: ${summary.inactiveCount}`} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard
          title="Clientes mais engajados"
          description="Quem mais avançou na ativação da plataforma."
          action={<Link href="/admin/clientes" className="text-sm font-medium text-primary">Ver todos</Link>}
        >
          <div className="space-y-3">
            {topBusinesses.length ? (
              topBusinesses.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{item.business_name}</p>
                      <p className="text-sm text-muted">{item.owner?.full_name || item.owner?.email || 'Sem responsável'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>
                        {statusLabel(item.status)}
                      </StatusBadge>
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                        Score {item.activityScore}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="rounded-full border border-border px-3 py-1">Serviços {item.servicesCount}</span>
                    <span className="rounded-full border border-border px-3 py-1">Clientes {item.customersCount}</span>
                    <span className="rounded-full border border-border px-3 py-1">Solicitações {item.requestsCount}</span>
                    <span className="rounded-full border border-border px-3 py-1">Agenda {item.appointmentsCount}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Ainda não há clientes suficientes para comparar engajamento.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Precisam de atenção" description="Negócios com pouca ativação ou que exigem ação sua.">
          <div className="space-y-3">
            {inactiveBusinesses.length ? (
              inactiveBusinesses.map((item) => (
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
                    {item.needsAttention.map((reason: string) => (
                      <span key={reason} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Nenhum cliente crítico agora. Ótimo sinal.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,0.9fr]">
        <SectionCard title="Chegaram agora" description="Últimos studios adicionados na plataforma.">
          <div className="space-y-3">
            {latestBusinesses.length ? (
              latestBusinesses.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{item.business_name}</p>
                      <p className="text-sm text-muted">{item.city || 'Sem cidade'} • criado em {formatDateBR(item.created_at?.slice(0, 10))}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>
                        {statusLabel(item.status)}
                      </StatusBadge>
                      <Link href={`/admin/clientes/${item.id}`} className="text-sm font-medium text-primary">
                        Abrir
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="rounded-full border border-border px-3 py-1">Serviços {item.servicesCount}</span>
                    <span className="rounded-full border border-border px-3 py-1">Solicitações {item.requestsCount}</span>
                    <span className="rounded-full border border-border px-3 py-1">Agenda {item.appointmentsCount}</span>
                    <span className={`rounded-full px-3 py-1 ${item.publicReady ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                      {item.publicReady ? 'Página pronta' : 'Página incompleta'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Ainda não existem novos negócios cadastrados.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Atalhos rápidos" description="Áreas mais úteis para tocar a operação da plataforma.">
          <div className="grid gap-3">
            <Link href="/admin/clientes" className="rounded-2xl border border-border bg-white p-4 transition hover:bg-primary-soft">
              <p className="font-medium">Base de clientes</p>
              <p className="mt-1 text-sm text-muted">Filtre, acompanhe uso e ajuste status do studio.</p>
            </Link>
            <Link href="/admin/financeiro" className="rounded-2xl border border-border bg-white p-4 transition hover:bg-primary-soft">
              <p className="font-medium">Assinaturas da plataforma</p>
              <p className="mt-1 text-sm text-muted">Veja MRR estimado, potencial de conversão e clientes em risco.</p>
            </Link>
            <Link href="/admin/uso" className="rounded-2xl border border-border bg-white p-4 transition hover:bg-primary-soft">
              <p className="font-medium">Uso da plataforma</p>
              <p className="mt-1 text-sm text-muted">Entenda ativação, adoção e onde insistir no onboarding.</p>
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
