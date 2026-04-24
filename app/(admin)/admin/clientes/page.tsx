import Link from 'next/link';
import { TopHeading, EmptyState, SectionCard, StatusBadge } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { statusLabel, currencyBRL } from '@/lib/utils';

export default async function AdminClientesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; plan?: string }>;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() || '';
  const selectedStatus = params?.status || '';
  const selectedPlan = params?.plan || '';

  let businessesQuery = supabase
    .from('businesses')
    .select('id, business_name, city, plan_name, status, slug, profiles:owner_id(full_name,email)')
    .order('created_at', { ascending: false });

  if (query) businessesQuery = businessesQuery.ilike('business_name', `%${query}%`);
  if (selectedStatus) businessesQuery = businessesQuery.eq('status', selectedStatus);
  if (selectedPlan) businessesQuery = businessesQuery.eq('plan_name', selectedPlan);

  const [{ data }, { data: payments }] = await Promise.all([
    businessesQuery,
    supabase.from('payments').select('business_id, final_amount').eq('payment_status', 'paid')
  ]);

  const revenueMap = new Map<string, number>();
  (payments || []).forEach((item) => {
    revenueMap.set(item.business_id, (revenueMap.get(item.business_id) || 0) + Number(item.final_amount || 0));
  });

  const businesses = data || [];

  return (
    <div>
      <TopHeading title="Clientes" description="Encontre rapidamente qualquer studio, filtre por plano e veja quem está gerando mais resultado." action={<Link href="/admin/clientes/novo" className="rounded-2xl bg-white px-5 py-3 text-dark">Novo cliente</Link>} />

      <SectionCard title="Busca e filtros" description="Afine a lista por nome, status ou plano." className="mb-6">
        <form className="grid gap-4 md:grid-cols-[1fr,220px,220px,160px]">
          <input name="q" defaultValue={query} placeholder="Buscar por negócio" className="w-full rounded-2xl border border-border bg-white px-4 py-3" />
          <select name="status" defaultValue={selectedStatus} className="w-full rounded-2xl border border-border bg-white px-4 py-3">
            <option value="">Todos os status</option>
            <option value="trial">Teste</option>
            <option value="active">Ativo</option>
            <option value="blocked">Bloqueado</option>
          </select>
          <select name="plan" defaultValue={selectedPlan} className="w-full rounded-2xl border border-border bg-white px-4 py-3">
            <option value="">Todos os planos</option>
            <option value="start">Start</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-white">Filtrar</button>
        </form>
      </SectionCard>

      <div className="rounded-[1.5rem] border border-white/10 bg-white p-4 shadow-sm">
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
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.business_name}</p>
                        <p className="text-xs text-muted">{item.city || '-'}</p>
                      </td>
                      <td className="px-4 py-3">{owner?.full_name || owner?.email || '-'}</td>
                      <td className="px-4 py-3">{item.plan_name}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status === 'active' ? 'success' : item.status === 'trial' ? 'warning' : 'danger'}>{statusLabel(item.status)}</StatusBadge></td>
                      <td className="px-4 py-3">{currencyBRL(revenueMap.get(item.id) || 0)}</td>
                      <td className="px-4 py-3"><a href={`/${item.slug}`} target="_blank" rel="noreferrer" className="text-primary">/{item.slug}</a></td>
                      <td className="px-4 py-3"><Link href={`/admin/clientes/${item.id}`} className="text-primary">Ver</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Nenhum cliente cadastrado" description="Cadastre o primeiro negócio para começar a usar a plataforma." />}
      </div>
    </div>
  );
}
