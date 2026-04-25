import Link from 'next/link';
import {
  confirmSubscriptionPayment,
  ensureCurrentMonthSubscription,
  markSubscriptionPending
} from '@/actions/admin-subscriptions';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { currencyBRL, formatDateBR, statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

type BusinessRow = {
  id: string;
  owner_id: string;
  business_name: string;
  city: string | null;
  plan_name: string | null;
  status: string;
  slug: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
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
      hint: 'Gere a mensalidade atual'
    };
  }

  if (subscription.status === 'paid') {
    return {
      label: 'Pago',
      tone: 'success' as const,
      hint: subscription.paid_at
        ? `Pago em ${formatDateBR(subscription.paid_at.slice(0, 10))}`
        : 'Pagamento confirmado'
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

export default async function AdminClientesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() || '';
  const selectedStatus = params?.status || '';
  const { month, year } = getCurrentReference();

  let businessesQuery = supabase
    .from('businesses')
    .select('id, owner_id, business_name, city, plan_name, status, slug')
    .order('created_at', { ascending: false });

  if (query) {
    businessesQuery = businessesQuery.ilike('business_name', `%${query}%`);
  }

  if (selectedStatus) {
    businessesQuery = businessesQuery.eq('status', selectedStatus);
  }

  const [{ data: businesses }, { data: services }, { data: requests }, { data: appointments }, { data: subscriptions }] =
    await Promise.all([
      businessesQuery,
      supabase.from('services').select('business_id'),
      supabase.from('booking_requests').select('business_id, status'),
      supabase.from('appointments').select('business_id, status'),
      supabase
        .from('platform_subscriptions')
        .select('*')
        .eq('reference_month', month)
        .eq('reference_year', year)
    ]);

  const businessRows = (businesses || []) as BusinessRow[];

  const ownerIds = Array.from(new Set(businessRows.map((item) => item.owner_id).filter(Boolean)));
  const { data: profiles } = ownerIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', ownerIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map<string, ProfileRow>();
  (profiles || []).forEach((item) => {
    profileMap.set(item.id, item);
  });

  const serviceMap = new Map<string, number>();
  const requestMap = new Map<string, number>();
  const pendingMap = new Map<string, number>();
  const appointmentMap = new Map<string, number>();
  const subscriptionMap = new Map<string, SubscriptionRow>();

  (services || []).forEach((item) => {
    serviceMap.set(item.business_id, (serviceMap.get(item.business_id) || 0) + 1);
  });

  (requests || []).forEach((item) => {
    requestMap.set(item.business_id, (requestMap.get(item.business_id) || 0) + 1);
    if (item.status === 'pending') {
      pendingMap.set(item.business_id, (pendingMap.get(item.business_id) || 0) + 1);
    }
  });

  (appointments || []).forEach((item) => {
    appointmentMap.set(item.business_id, (appointmentMap.get(item.business_id) || 0) + 1);
  });

  ((subscriptions || []) as SubscriptionRow[]).forEach((item) => {
    subscriptionMap.set(item.business_id, item);
  });

  return (
    <div>
      <TopHeading
        title="Clientes da plataforma"
        description="Acompanhe status da conta, uso da plataforma e a mensalidade do seu sistema."
        action={
          <Link
            href="/admin/clientes/novo"
            className="rounded-2xl bg-primary px-5 py-3 text-white transition hover:opacity-90"
          >
            Novo cliente
          </Link>
        }
      />

      <form className="mb-6 grid gap-3 rounded-[1.5rem] border border-border bg-surface p-4 md:grid-cols-[1fr,220px,160px]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome do negócio..."
          className="rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary"
        />

        <select
          name="status"
          defaultValue={selectedStatus}
          className="rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary"
        >
          <option value="">Todos os status</option>
          <option value="trial">Teste</option>
          <option value="active">Ativo</option>
          <option value="blocked">Bloqueado</option>
        </select>

        <button className="rounded-2xl border border-border bg-white px-4 py-3 font-medium transition hover:bg-primary-soft">
          Filtrar
        </button>
      </form>

      <SectionCard
        title="Plano comercial atual"
        description="Todos os clientes entram no mesmo plano e o admin acompanha cobrança e atividade."
      >
        <div className="rounded-2xl border border-primary/15 bg-primary-soft p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-2xl font-serif">{SINGLE_PLAN_LABEL}</h3>
              <p className="mt-1 text-sm text-muted">
                Mensalidade da plataforma: {currencyBRL(SINGLE_PLAN_PRICE)}/mês
              </p>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white px-5 py-4">
              <p className="text-sm text-muted">Referência atual</p>
              <p className="mt-1 text-2xl font-semibold">
                {String(month).padStart(2, '0')}/{year}
              </p>
            </div>
          </div>
        </div>

        {businessRows.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 pr-4">Negócio</th>
                  <th className="pb-3 pr-4">Responsável</th>
                  <th className="pb-3 pr-4">Plano</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Uso da plataforma</th>
                  <th className="pb-3 pr-4">Mensalidade do mês</th>
                  <th className="pb-3 pr-4">Link público</th>
                  <th className="pb-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {businessRows.map((item) => {
                  const owner = profileMap.get(item.owner_id);
                  const servicesCount = serviceMap.get(item.id) || 0;
                  const requestsCount = requestMap.get(item.id) || 0;
                  const pendingRequests = pendingMap.get(item.id) || 0;
                  const appointmentsCount = appointmentMap.get(item.id) || 0;
                  const publicReady = Boolean(item.slug) && servicesCount > 0;
                  const subscription = subscriptionMap.get(item.id) || null;
                  const billing = getSubscriptionVisual(subscription);

                  return (
                    <tr key={item.id} className="border-b border-border/70 align-top">
                      <td className="py-4 pr-4">
                        <p className="font-medium">{item.business_name}</p>
                        <p className="mt-1 text-xs text-muted">{item.city || '-'}</p>
                      </td>

                      <td className="py-4 pr-4">
                        <p>{owner?.full_name || owner?.email || '-'}</p>
                        <p className="mt-1 text-xs text-muted">Conta da dona do studio</p>
                      </td>

                      <td className="py-4 pr-4">
                        <p className="font-medium">{SINGLE_PLAN_LABEL}</p>
                        <p className="mt-1 text-xs text-muted">{currencyBRL(SINGLE_PLAN_PRICE)}/mês</p>
                      </td>

                      <td className="py-4 pr-4">
                        <StatusBadge
                          status={
                            item.status === 'active'
                              ? 'success'
                              : item.status === 'trial'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {statusLabel(item.status)}
                        </StatusBadge>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2 text-xs text-muted">
                          <span className="rounded-full border border-border px-3 py-1">Serviços {servicesCount}</span>
                          <span className="rounded-full border border-border px-3 py-1">Solicitações {requestsCount}</span>
                          <span className="rounded-full border border-border px-3 py-1">Pendentes {pendingRequests}</span>
                          <span className="rounded-full border border-border px-3 py-1">Agenda {appointmentsCount}</span>
                          <span
                            className={`rounded-full px-3 py-1 ${
                              publicReady ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {publicReady ? 'Página pronta' : 'Página incompleta'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="space-y-2">
                          <StatusBadge status={billing.tone}>{billing.label}</StatusBadge>

                          <div className="text-xs text-muted">
                            <p>{billing.hint}</p>
                            {subscription ? (
                              <>
                                <p className="mt-1">Vencimento: {formatDateBR(subscription.due_date)}</p>
                                <p className="mt-1">Valor: {currencyBRL(subscription.amount)}</p>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        {item.slug ? (
                          <Link href={`/${item.slug}`} className="text-sm font-medium text-primary" target="_blank">
                            /{item.slug}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted">Sem slug</span>
                        )}
                      </td>

                      <td className="py-4">
                        <div className="flex flex-col gap-2">
                          {!subscription ? (
                            <form action={ensureCurrentMonthSubscription}>
                              <input type="hidden" name="businessId" value={item.id} />
                              <button className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium transition hover:bg-primary-soft">
                                Gerar mês atual
                              </button>
                            </form>
                          ) : subscription.status !== 'paid' ? (
                            <form action={confirmSubscriptionPayment}>
                              <input type="hidden" name="subscriptionId" value={subscription.id} />
                              <input type="hidden" name="businessId" value={item.id} />
                              <input type="hidden" name="amount" value={subscription.amount} />
                              <input type="hidden" name="paymentMethod" value="pix" />
                              <button className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-white transition hover:opacity-90">
                                Confirmar pagamento
                              </button>
                            </form>
                          ) : (
                            <form action={markSubscriptionPending}>
                              <input type="hidden" name="subscriptionId" value={subscription.id} />
                              <input type="hidden" name="businessId" value={item.id} />
                              <input type="hidden" name="dueDate" value={subscription.due_date} />
                              <button className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium transition hover:bg-primary-soft">
                                Voltar pendente
                              </button>
                            </form>
                          )}

                          <Link
                            href={`/admin/clientes/${item.id}`}
                            className="rounded-xl border border-border bg-white px-3 py-2 text-center text-xs font-medium transition hover:bg-primary-soft"
                          >
                            Abrir cliente
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ainda não existem studios cadastrados ou o filtro atual não retornou resultados."
            action={
              <Link href="/admin/clientes/novo" className="rounded-2xl bg-primary px-5 py-3 text-white">
                Criar o primeiro cliente
              </Link>
            }
          />
        )}
      </SectionCard>
    </div>
  );
}
