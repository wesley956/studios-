import Link from 'next/link';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { statusLabel } from '@/lib/utils';
import { SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';

type BusinessRow = {
  id: string;
  business_name: string;
  city: string | null;
  plan_name: string | null;
  status: string;
  slug: string;
  profiles: { full_name: string | null; email: string | null }[] | { full_name: string | null; email: string | null } | null;
};

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

  let businessesQuery = supabase
    .from('businesses')
    .select('id, business_name, city, plan_name, status, slug, profiles:owner_id(full_name,email)')
    .order('created_at', { ascending: false });

  if (query) businessesQuery = businessesQuery.ilike('business_name', `%${query}%`);
  if (selectedStatus) businessesQuery = businessesQuery.eq('status', selectedStatus);

  const [{ data }, { data: services }, { data: requests }, { data: appointments }] = await Promise.all([
    businessesQuery,
    supabase.from('services').select('business_id'),
    supabase.from('booking_requests').select('business_id, status'),
    supabase.from('appointments').select('business_id, status')
  ]);

  const serviceMap = new Map<string, number>();
  const requestMap = new Map<string, number>();
  const pendingMap = new Map<string, number>();
  const appointmentMap = new Map<string, number>();

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

  const businesses = (data || []) as unknown as BusinessRow[];

  return (
    <div>
      <TopHeading
        title="Clientes da plataforma"
        description={`Gerencie sua base com plano único de R$ ${SINGLE_PLAN_PRICE.toFixed(2).replace('.', ',')}/mês, sem enxergar o faturamento interno dos studios.`}
        action={
          <Link href="/admin/clientes/novo" className="rounded-2xl bg-primary px-5 py-3 text-white transition hover:opacity-90">
            Novo cliente
          </Link>
        }
      />

      <SectionCard title="Filtros" description="Busque negócios pelo nome e concentre a leitura por status.">
        <form className="grid gap-3 md:grid-cols-[1.4fr,0.8fr,auto]">
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome do negócio"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary"
          />
          <select
            name="status"
            defaultValue={selectedStatus}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary"
          >
            <option value="">Todos os status</option>
            <option value="trial">Teste</option>
            <option value="active">Ativo</option>
            <option value="blocked">Bloqueado</option>
          </select>
          <button type="submit" className="rounded-2xl border border-border bg-white px-4 py-3 transition hover:bg-primary-soft">
            Filtrar
          </button>
        </form>
      </SectionCard>

      <div className="mt-4 rounded-[1.5rem] border border-primary/15 bg-primary-soft p-5">
        <p className="text-sm text-muted">Plano comercial atual</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">{SINGLE_PLAN_LABEL}</p>
            <p className="mt-1 text-sm text-muted">Uso do admin focado em assinatura, atividade e adoção do produto.</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm font-medium">
            R$ {SINGLE_PLAN_PRICE.toFixed(2).replace('.', ',')}/mês
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        {businesses.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-4 py-3">Negócio</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Uso da plataforma</th>
                  <th className="px-4 py-3">Link público</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((item) => {
                  const owner = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                  const servicesCount = serviceMap.get(item.id) || 0;
                  const requestsCount = requestMap.get(item.id) || 0;
                  const pendingRequests = pendingMap.get(item.id) || 0;
                  const appointmentsCount = appointmentMap.get(item.id) || 0;
                  const publicReady = Boolean(item.slug) && servicesCount > 0;

                  return (
                    <tr key={item.id} className="border-t border-border align-top">
                      <td className="px-4 py-4">
                        <p className="font-medium">{item.business_name}</p>
                        <p className="mt-1 text-xs text-muted">{item.city || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{owner?.full_name || owner?.email || '-'}</p>
                        <p className="mt-1 text-xs text-muted">Conta da dona do studio</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">{SINGLE_PLAN_LABEL}</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>
                          {statusLabel(item.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2 text-xs text-muted">
                          <span className="rounded-full border border-border px-3 py-1">Serviços {servicesCount}</span>
                          <span className="rounded-full border border-border px-3 py-1">Solicitações {requestsCount}</span>
                          <span className="rounded-full border border-border px-3 py-1">Pendentes {pendingRequests}</span>
                          <span className="rounded-full border border-border px-3 py-1">Agenda {appointmentsCount}</span>
                          <span className={`rounded-full px-3 py-1 ${publicReady ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                            {publicReady ? 'Página pronta' : 'Página incompleta'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/${item.slug}`} className="font-medium text-primary">
                          /{item.slug}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/admin/clientes/${item.id}`} className="font-medium text-primary">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Nenhum negócio encontrado" description="Ajuste os filtros ou crie um novo cliente na plataforma." />
        )}
      </div>
    </div>
  );
}
