import Link from 'next/link';
import { EmptyState, SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { currencyBRL, formatDateBR, formatDateTimeBR, formatTime, statusLabel } from '@/lib/utils';
import { getClientDashboardMetrics } from '@/lib/metrics';

export default async function ClientDashboard() {
  const { business, summary, latestPayments, upcomingAppointments } = await getClientDashboardMetrics();

  return (
    <div>
      <TopHeading
        title={business.business_name || 'Dashboard'}
        description="Tenha uma visão clara da operação: dinheiro entrando, agenda do dia, pedidos pendentes e o que mais vende."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/app/agenda" className="rounded-2xl bg-primary px-5 py-3 text-white">Abrir agenda</Link>
            <Link href="/app/financeiro" className="rounded-2xl border border-border bg-white px-5 py-3">Ver financeiro</Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recebido hoje" value={currencyBRL(summary.receivedToday)} tone="success" hint="Pagamentos registrados hoje" />
        <StatCard label="Recebido no mês" value={currencyBRL(summary.receivedMonth)} tone="success" hint="Faturamento confirmado no mês atual" />
        <StatCard label="Ticket médio" value={currencyBRL(summary.ticketAverage)} hint="Média dos atendimentos concluídos no mês" />
        <StatCard label="Solicitações pendentes" value={summary.pendingRequests} tone={summary.pendingRequests ? 'warning' : 'default'} hint="Pedidos aguardando aprovação" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Serviços cadastrados" value={summary.servicesCount} />
        <StatCard label="Clientes" value={summary.customersCount} />
        <StatCard label="Agendamentos" value={summary.appointmentsCount} />
        <StatCard label="Serviço campeão" value={summary.topService} hint={summary.topServiceCount ? `${summary.topServiceCount} atendimentos concluídos no mês` : 'Sem vendas registradas ainda'} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard title="Próximos atendimentos" description="Acompanhe o que já está confirmado e o que já foi concluído recentemente.">
          <div className="space-y-3">
            {upcomingAppointments.length ? upcomingAppointments.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{(item.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</p>
                    <p className="text-sm text-muted">
                      {(item.services as { name?: string } | null)?.name || 'Serviço'} • {formatDateBR(item.appointment_date)} às {formatTime(item.appointment_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status === 'completed' ? 'success' : 'neutral'}>{statusLabel(item.status)}</StatusBadge>
                    <span className="text-sm font-medium">{currencyBRL(item.final_price)}</span>
                  </div>
                </div>
              </div>
            )) : <EmptyState title="Agenda vazia" description="Assim que você aprovar pedidos, os atendimentos aparecem aqui." />}
          </div>
        </SectionCard>

        <SectionCard title="Recebimentos recentes" description="Últimos pagamentos lançados no sistema." action={<Link href="/app/financeiro" className="text-sm text-primary">Abrir financeiro</Link>}>
          <div className="space-y-3">
            {latestPayments.length ? latestPayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{(payment.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</p>
                    <p className="text-sm text-muted">{(payment.services as { name?: string } | null)?.name || 'Atendimento'}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTimeBR(payment.paid_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currencyBRL(payment.final_amount)}</p>
                    <p className="mt-1 text-xs uppercase text-muted">{statusLabel(payment.payment_method || '')}</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState title="Sem pagamentos ainda" description="Conclua um atendimento e registre o pagamento para começar a ver o financeiro aqui." />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
