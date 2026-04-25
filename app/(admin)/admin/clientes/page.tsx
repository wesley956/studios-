import Link from 'next/link';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { currencyBRL, formatDateBR, statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

type BusinessRow = {
  id: string;
  business_name: string;
  city: string | null;
  status: string;
  slug: string;
  created_at: string | null;
  profiles: { full_name: string | null; email: string | null }[] | { full_name: string | null; email: string | null } | null;
};

type SubscriptionRow = {
  id: string;
  business_id: string;
  reference_month: number;
  reference_year: number;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
};

function getCurrentReference() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function daysUntil(dateString: string) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(`${dateString}T00:00:00`);
  const diff = due.getTime() - todayOnly.getTime();
  return Math.round(diff / 86400000);
}

function getSubscriptionVisual(subscription: SubscriptionRow | null) {
  if (!subscription) {
    return {
      label: 'Sem cobrança do mês',
      tone: 'dark' as const,
      hint: 'Gere a mensalidade atual',
      nearDue: false
    };
  }

  if (subscription.status === 'paid') {
    return {
      label: 'Pago neste mês',
      tone: 'success' as const,
      hint: subscription.paid_at ? `Pago em ${formatDateBR(subscription.paid_at.slice(0, 10))}` : 'Pagamento confirmado',
      nearDue: false
    };
  }

  if (subscription.status === 'waived') {
    return {
      label: 'Isento neste mês',
      tone: 'neutral' as const,
      hint: 'Cobrança dispensada',
      nearDue: false
    };
  }

  const diff = daysUntil(subscription.due_date);

  if (diff < 0 || subscription.status === 'overdue') {
    return {
      label: 'Atrasado',
      tone: 'danger' as const,
      hint: `Venceu há ${Math.abs(diff)} dia(s)`,
      nearDue: false
    };
  }

  if (diff <= 5) {
    return {
      label: 'Vencendo em breve',
      tone: 'warning' as const,
      hint: diff === 0 ? 'Vence hoje' : `Vence em ${diff} dia(s)`,
      nearDue: true
    };
  }

  return {
    label: 'Pendente',
    tone: 'warning' as const,
    hint: `Vence em ${diff} dia(s)`,
    nearDue: false
  };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createClient();
  const { month, year } = getCurrentReference();

  const [{ data: businesses }, { data: services }, { data: requests }, { data: appointments }, { data: subscriptions }] =
    await Promise.all([
      supabase
        .from('businesses')
        .select('id, business_name, city, status, slug, created_at, profiles:owner_id(full_name,email)')
        .order('created_at', { ascending: false }),
      supabase.from('services').select('business_id'),
      supabase.from('booking_requests').select('business_id, status'),
      supabase.from('appointments').select('business_id, status'),
      supabase
        .from('platform_subscriptions')
        .select('*')
        .eq('reference_month', month)
        .eq('reference_year', year)
    ]);

  const businessRows = (businesses || []) as unknown as BusinessRow[];
  const currentSubscriptions = (subscriptions || []) as SubscriptionRow[];

  const servicesMap = new Map<string, number>();
  const requestMap = new Map<string, number>();
  const appointmentMap = new Map<string, number>();

  (services || []).forEach((item) => {
    servicesMap.set(item.business_id, (servicesMap.get(item.business_id) || 0) + 1);
  });

  (requests || []).forEach((item) => {
    requestMap.set(item.business_id, (requestMap.get(item.business_id) || 0) + 1);
  });

  (appointments || []).forEach((item) => {
    appointmentMap.set(item.business_id, (appointmentMap.get(item.business_id) || 0) + 1);
  });

  const subscriptionMap = new Map<string, SubscriptionRow>();
  currentSubscriptions.forEach((item) => {
    subscriptionMap.set(item.business_id, item);
  });

  const recurringRevenue = businessRows.filter((item) => item.status === 'active').length * SINGLE_PLAN_PRICE;
  const paidCount = currentSubscriptions.filter((item) => item.status === 'paid').length;
  const pendingCount = businessRows.filter((item) => {
    const sub = subscriptionMap.get(item.id);
    return !sub || ['pending', 'overdue'].includes(sub.status);
  }).length;

  const dueSoonBusinesses = businessRows
    .map((business) => {
      const subscription = subscriptionMap.get(business.id) || null;
      return {
        business,
        subscription,
        visual: getSubscriptionVisual(subscription)
      };
    })
    .filter((item) => item.visual.nearDue || item.visual.label === 'Atrasado')
    .slice(0, 8);

  const attentionBusinesses = businessRows
    .map((business) => {
      const servicesCount = servicesMap.get(business.id) || 0;
      const requestsCount = requestMap.get(business.id) || 0;
      const appointmentsCount = appointmentMap.get(business.id) || 0;
      const subscription = subscriptionMap.get(business.id) || null;
      const issues: string[] = [];

      if (!subscription) issues.push('Sem cobrança do mês');
      if (subscription && getSubscriptionVisual(subscription).label === 'Atrasado') issues.push('Mensalidade atrasada');
      if (!servicesCount) issues.push('Sem serviços cadastrados');
      if (!appointmentsCount) issues.push('Sem agenda ativa');
      if (!requestsCount) issues.push('Sem solicitações recentes');

      return {
        business,
        issues: issues.slice(0, 3)
      };
    })
    .filter((item) => item.issues.length > 0)
    .slice(0, 8);

  return (
    <div>
      <TopHeading
        title="Central de controle"
        description="Aqui você acompanha a saúde da plataforma, a mensalidade do seu sistema e quem precisa de contato ou ação."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/clientes/novo" className="rounded-2xl bg-primary px-5 py-3 text-white transition hover:opacity-90">
              Criar novo cliente
            </Link>
            <Link href="/admin/financeiro" className="rounded-2xl border border-border bg-white px-5 py-3 transition hover:bg-primary-soft">
              Assinaturas
            </Link>
          </div>
        }
      />

      <div className="mb-6 rounded-[1.5rem] border border-primary/15 bg-primary-soft p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Modelo comercial atual</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-2xl font-serif">{SINGLE_PLAN_LABEL}</h3>
            <p className="mt-1 text-sm text-muted">
              Preço definido: {currencyBRL(SINGLE_PLAN_PRICE)}/mês. O admin acompanha assinatura, vencimento e uso da plataforma.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white p-4">
              <p className="text-sm text-muted">MRR estimado</p>
              <p className="mt-2 text-2xl font-semibold">{currencyBRL(recurringRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white p-4">
              <p className="text-sm text-muted">Referência</p>
              <p className="mt-2 text-2xl font-semibold">
                {String(month).padStart(2, '0')}/{year}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Studios na base" value={businessRows.length} hint="Todos os clientes cadastrados" />
        <StatCard label="Pagaram este mês" value={paidCount} hint="Mensalidade confirmada" tone="success" />
        <StatCard label="Pendentes / atrasados" value={pendingCount} hint="Precisam de cobrança ou contato" tone="warning" />
        <StatCard label="Vencendo em breve" value={dueSoonBusinesses.filter((item) => item.visual.nearDue).length} hint="Bom momento para avisar" tone="dark" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes ativos" value={businessRows.filter((item) => item.status === 'active').length} hint="Assinatura liberada" tone="success" />
        <StatCard label="Clientes em teste" value={businessRows.filter((item) => item.status === 'trial').length} hint="Potencial de conversão" tone="warning" />
        <StatCard label="Clientes bloqueados" value={businessRows.filter((item) => item.status === 'blocked').length} hint="Precisam de ação" tone="dark" />
        <StatCard label="Valor mensal" value={currencyBRL(SINGLE_PLAN_PRICE)} hint="Plano único" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard title="Vencendo em breve" description="Clientes para você lembrar antes de atrasar.">
          <div className="space-y-3">
            {dueSoonBusinesses.length ? (
              dueSoonBusinesses.map(({ business, subscription, visual }) => {
                const owner = Array.isArray(business.profiles) ? business.profiles[0] : business.profiles;

                return (
                  <div key={business.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{business.business_name}</p>
                        <p className="text-sm text-muted">{owner?.full_name || owner?.email || 'Sem responsável'}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={visual.tone}>{visual.label}</StatusBadge>
                        <Link href={`/admin/clientes/${business.id}`} className="text-sm font-medium text-primary">
                          Abrir
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-border px-3 py-1">{visual.hint}</span>
                      {subscription ? (
                        <span className="rounded-full border border-border px-3 py-1">
                          Vencimento {formatDateBR(subscription.due_date)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">Nenhum cliente vencendo nos próximos dias agora.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Precisam de atenção" description="Clientes com cobrança ou ativação pedindo sua ação.">
          <div className="space-y-3">
            {attentionBusinesses.length ? (
              attentionBusinesses.map(({ business, issues }) => {
                const owner = Array.isArray(business.profiles) ? business.profiles[0] : business.profiles;

                return (
                  <div key={business.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{business.business_name}</p>
                        <p className="text-sm text-muted">{owner?.full_name || owner?.email || 'Sem responsável'}</p>
                      </div>
                      <Link href={`/admin/clientes/${business.id}`} className="text-sm font-medium text-primary">
                        Ver detalhe
                      </Link>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                      {issues.map((reason) => (
                        <span key={reason} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">Nenhum cliente pedindo atenção imediata.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
