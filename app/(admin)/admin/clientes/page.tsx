import Link from 'next/link';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { currencyBRL, statusLabel } from '@/lib/utils';
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

  const [{ data }, { data: payments }] = await Promise.all([
    businessesQuery,
    supabase.from('payments').select('business_id, amount').in('payment_status', ['paid', 'partial']).gt('amount', 0)
  ]);

  const revenueMap = new Map<string, number>();
  (payments || []).forEach((item) => {
    revenueMap.set(item.business_id, (revenueMap.get(item.business_id) || 0) + Number(item.amount || 0));
  });

  const businesses = (data || []) as unknown as BusinessRow[];

  return (
    <div>
      <TopHeading
        title="Clientes da plataforma"
        description="Gerencie sua base com o modelo comercial simplificado: um único plano de R$ 69,90/mês."
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
                  <th className="px-4 py-3">Receita acumulada</th>
                  <th className="px-4 py-3">Link público</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((item) => {
                  const owner = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                  return (
                    <tr key={item.id} className="border-t border-border align-top">
                      <td className="px-4 py-4">
                        <p className="font-medium">{item.business_name}</p>
                        <p className="mt-1 text-xs text-muted">{item.city || 'Sem cidade'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{owner?.full_name || owner?.email || '-'}</p>
                        <p className="mt-1 text-xs text-muted">Cobrança padrão: {currencyBRL(SINGLE_PLAN_PRICE)}/mês</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{SINGLE_PLAN_LABEL}</p>
                        <p className="mt-1 text-xs text-muted">Plano fixo</p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>
                          {statusLabel(item.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4 font-medium">{currencyBRL(revenueMap.get(item.id) || 0)}</td>
                      <td className="px-4 py-4">
                        <Link href={`/${item.slug}`} className="text-primary" target="_blank">
                          /{item.slug}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/admin/clientes/${item.id}`} className="text-primary font-medium">
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
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Tente outro filtro ou crie um novo cliente na plataforma."
            action={
              <Link href="/admin/clientes/novo" className="rounded-2xl bg-primary px-5 py-3 text-white transition hover:opacity-90">
                Criar cliente
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
