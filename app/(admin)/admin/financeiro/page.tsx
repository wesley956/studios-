import Link from 'next/link';
import {
  confirmSubscriptionPayment,
  ensureCurrentMonthSubscription,
  markSubscriptionPending
} from '@/actions/admin-subscriptions';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { currencyBRL, formatDateBR } from '@/lib/utils';
import { SINGLE_PLAN_PRICE } from '@/lib/validations/business';

type BusinessRow = {
  id: string;
  business_name: string;
  city: string | null;
  status: string;
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
  return Math.round((due.getTime() - todayOnly.getTime()) / 86400000);
}

function getSubscriptionVisual(subscription: SubscriptionRow | null) {
  if (!subscription) {
    return {
      label: 'Sem cobrança',
      tone: 'dark' as const,
      hint: 'Gere o mês atual'
    };
  }

  if (subscription.status === 'paid') {
    return {
      label: 'Pago',
      tone: 'success' as const,
      hint: subscription.paid_at ? `Pago em ${formatDateBR(subscription.paid_at.slice(0, 10))}` : 'Pagamento confirmado'
    };
  }

  if (subscription.status === 'waived') {
    return {
      label: 'Isento',
      tone: 'neutral' as const,
      hint: 'Cobrança dispensada'
    };
  }

  const diff = daysUntil(subscription.due_date);

  if (diff < 0 || subscription.status === 'overdue') {
    return {
      label: 'Atrasado',
      tone: 'danger' as const,
      hint: `Venceu há ${Math.abs(diff)} dia(s)`
    };
  }

  if (diff <= 5) {
    return {
      label: 'Vencendo',
      tone: 'warning' as const,
      hint: diff === 0 ? 'Vence hoje' : `Vence em ${diff} dia(s)`
    };
  }

  return {
    label: 'Pendente',
    tone: 'warning' as const,
    hint: `Vence em ${diff} dia(s)`
  };
}

export default async function AdminFinanceiroPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { month, year } = getCurrentReference();

  const [{ data: businesses }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, business_name, city, status, profiles:owner_id(full_name,email)')
      .order('business_name'),
    supabase
      .from('platform_subscriptions')
      .select('*')
      .eq('reference_month', month)
      .eq('reference_year', year)
  ]);

  const businessRows = (businesses || []) as unknown as BusinessRow[];
  const currentSubscriptions = (subscriptions || []) as SubscriptionRow[];

  const subscriptionMap = new Map<string, SubscriptionRow>();
  currentSubscriptions.forEach((item) => {
    subscriptionMap.set(item.business_id, item);
  });

  const expectedMRR = businessRows.filter((item) => item.status === 'active').length * SINGLE_PLAN_PRICE;
  const receivedThisMonth = currentSubscriptions
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const pendingBusinesses = businessRows.filter((item) => {
    const sub = subscriptionMap.get(item.id);
    return !sub || ['pending', 'overdue'].includes(sub.status);
  });

  const overdueBusinesses = businessRows.filter((item) => {
    const sub = subscriptionMap.get(item.id);
    if (!sub) return false;
    const visual = getSubscriptionVisual(sub);
    return visual.label === 'Atrasado';
  });

  const dueSoonBusinesses = businessRows.filter((item) => {
    const sub = subscriptionMap.get(item.id);
    if (!sub) return false;
    const visual = getSubscriptionVisual(sub);
    return visual.label === 'Vencendo';
  });

  return (
    <div>
      <TopHeading
        title="Financeiro da plataforma"
        description="Aqui você controla a mensalidade do seu sistema: quem pagou, quem está pendente e quem está perto de vencer."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR esperado" value={currencyBRL(expectedMRR)} hint="Plano único de R$ 69,90" />
        <StatCard label="Recebido no mês" value={currencyBRL(receivedThisMonth)} hint={`Referência ${String(month).padStart(2, '0')}/${year}`} tone="success" />
        <StatCard label="Pendentes" value={pendingBusinesses.length} hint="Cobrar ou confirmar" tone="warning" />
        <StatCard label="Atrasados" value={overdueBusinesses.length} hint="Pedem contato direto" tone="dark" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vencendo em breve" value={dueSoonBusinesses.length} hint="Até 5 dias para vencer" tone="warning" />
        <StatCard label="Pagaram" value={currentSubscriptions.filter((item) => item.status === 'paid').length} hint="Mensalidade confirmada" tone="success" />
        <StatCard label="Isentos" value={currentSubscriptions.filter((item) => item.status === 'waived').length} hint="Cobrança dispensada" />
        <StatCard label="Valor padrão" value={currencyBRL(SINGLE_PLAN_PRICE)} hint="Mensalidade base" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SectionCard title="Alertas de cobrança" description="Boa hora para lembrar a cliente antes de vencer ou agir no atraso.">
          <div className="space-y-3">
            {[...dueSoonBusinesses, ...overdueBusinesses].slice(0, 10).length ? (
              [...dueSoonBusinesses, ...overdueBusinesses].slice(0, 10).map((business) => {
                const subscription = subscriptionMap.get(business.id) || null;
                const owner = Array.isArray(business.profiles) ? business.profiles[0] : business.profiles;
                const visual = getSubscriptionVisual(subscription);

                return (
                  <div key={business.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{business.business_name}</p>
                        <p className="text-sm text-muted">{owner?.full_name || owner?.email || 'Sem responsável'}</p>
                      </div>

                      <StatusBadge status={visual.tone}>{visual.label}</StatusBadge>
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
              <p className="text-sm text-muted">Nenhum alerta crítico neste momento.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Mensalidades do mês" description="Confirme pagamento ou gere a cobrança atual em um clique.">
          <div className="space-y-3">
            {businessRows.map((business) => {
              const subscription = subscriptionMap.get(business.id) || null;
              const owner = Array.isArray(business.profiles) ? business.profiles[0] : business.profiles;
              const visual = getSubscriptionVisual(subscription);

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
                    <span className="rounded-full border border-border px-3 py-1">Status do studio: {business.status}</span>
                    {subscription ? (
                      <>
                        <span className="rounded-full border border-border px-3 py-1">
                          Valor {currencyBRL(subscription.amount)}
                        </span>
                        <span className="rounded-full border border-border px-3 py-1">
                          Vencimento {formatDateBR(subscription.due_date)}
                        </span>
                      </>
                    ) : (
                      <span className="rounded-full border border-border px-3 py-1">Sem cobrança gerada</span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {!subscription ? (
                      <form action={ensureCurrentMonthSubscription}>
                        <input type="hidden" name="businessId" value={business.id} />
                        <button className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-primary-soft">
                          Gerar mês atual
                        </button>
                      </form>
                    ) : subscription.status !== 'paid' ? (
                      <form action={confirmSubscriptionPayment}>
                        <input type="hidden" name="subscriptionId" value={subscription.id} />
                        <input type="hidden" name="businessId" value={business.id} />
                        <input type="hidden" name="amount" value={subscription.amount} />
                        <input type="hidden" name="paymentMethod" value={subscription.payment_method || 'pix'} />
                        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
                          Confirmar pagamento
                        </button>
                      </form>
                    ) : (
                      <form action={markSubscriptionPending}>
                        <input type="hidden" name="subscriptionId" value={subscription.id} />
                        <input type="hidden" name="businessId" value={business.id} />
                        <input type="hidden" name="dueDate" value={subscription.due_date} />
                        <button className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-primary-soft">
                          Voltar pendente
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
