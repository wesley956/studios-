import { createService, deleteService, toggleServiceVisibility, updateService } from '@/actions/client-services';
import { DangerButton, Field, Input, Select, SubmitButton, Textarea, SecondaryButton } from '@/components/shared/forms';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { requireClientOwner, getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { currencyBRL } from '@/lib/utils';

const categories = [
  { value: 'cabelos', label: 'Cabelos' },
  { value: 'unhas', label: 'Unhas' },
  { value: 'facial', label: 'Facial' },
  { value: 'sobrancelha', label: 'Sobrancelha' },
  { value: 'cilios', label: 'Cílios' },
  { value: 'massagem', label: 'Massagem' },
  { value: 'depilacao', label: 'Depilação' },
  { value: 'outros', label: 'Outros' }
];

export default async function ServicosPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>; 
}) {
  await requireClientOwner();
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() || '';

  let servicesQuery = supabase.from('services').select('*').eq('business_id', business.id).order('created_at', { ascending: false });
  if (query) servicesQuery = servicesQuery.ilike('name', `%${query}%`);

  const [{ data: services }, { data: appointments }] = await Promise.all([
    servicesQuery,
    supabase.from('appointments').select('service_id, status').eq('business_id', business.id)
  ]);

  async function handleCreateService(formData: FormData): Promise<void> {
    'use server';
    await createService(formData);
  }

  async function handleUpdateService(formData: FormData): Promise<void> {
    'use server';
    await updateService(formData);
  }

  async function handleDeleteService(formData: FormData): Promise<void> {
    'use server';
    await deleteService(formData);
  }

  async function handleToggleServiceVisibility(formData: FormData): Promise<void> {
    'use server';
    await toggleServiceVisibility(formData);
  }

  const serviceCountMap = new Map<string, number>();
  (appointments || []).forEach((item) => {
    if (!item.service_id || item.status === 'cancelled') return;
    serviceCountMap.set(item.service_id, (serviceCountMap.get(item.service_id) || 0) + 1);
  });

  return (
    <div>
      <TopHeading title="Serviços" description="Cadastre, edite e organize o catálogo que aparece na página pública e alimenta o financeiro." />

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr,340px]">
        <SectionCard title="Buscar serviço" description="Encontre rapidamente um serviço pelo nome.">
          <form className="flex flex-col gap-3 md:flex-row">
            <Input name="q" defaultValue={query} placeholder="Ex.: Design de sobrancelha" />
            <SubmitButton className="md:min-w-[160px]">Pesquisar</SubmitButton>
          </form>
        </SectionCard>
        <SectionCard title="Resumo" description="Catálogo ativo e pronto para venda.">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[#FBF7F3] p-4"><p className="text-muted">Ativos</p><p className="mt-1 text-2xl font-semibold">{services?.filter((item) => item.is_active).length || 0}</p></div>
            <div className="rounded-2xl bg-[#FBF7F3] p-4"><p className="text-muted">Ocultos</p><p className="mt-1 text-2xl font-semibold">{services?.filter((item) => !item.is_active).length || 0}</p></div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard title="Catálogo de serviços" description="Cada serviço pode ser editado, ocultado ou removido quando necessário.">
          <div className="grid gap-4 md:grid-cols-2">
            {services?.length ? services.map((service) => (
              <details key={service.id} className="group rounded-[1.5rem] border border-border p-5 open:bg-[#FCFAF7]">
                <summary className="flex cursor-pointer list-none flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl">{service.name}</h3>
                        <StatusBadge status={service.is_active ? 'success' : 'warning'}>{service.is_active ? 'Público' : 'Oculto'}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-muted">{service.description || 'Sem descrição.'}</p>
                    </div>
                    <span className="text-sm font-medium">{currencyBRL(service.price)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                    <span>{service.duration_minutes} min</span>
                    <span>{service.category || 'Sem categoria'}</span>
                    <span>{serviceCountMap.get(service.id) || 0} vendas/atendimentos</span>
                  </div>
                </summary>

                <form action={handleUpdateService} className="mt-5 grid gap-4 border-t border-border pt-5">
                  <input type="hidden" name="serviceId" value={service.id} />
                  <div className="grid gap-4">
                    <Field label="Nome"><Input name="name" defaultValue={service.name} /></Field>
                    <Field label="Descrição"><Textarea name="description" rows={3} defaultValue={service.description || ''} /></Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Preço"><Input name="price" type="number" step="0.01" defaultValue={service.price} /></Field>
                      <Field label="Duração (min)"><Input name="durationMinutes" type="number" defaultValue={service.duration_minutes} /></Field>
                    </div>
                    <Field label="Categoria">
                      <Select name="category" defaultValue={service.category || 'outros'}>
                        {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                      </Select>
                    </Field>
                    <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={service.is_active} /> Ativo na página pública</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <SubmitButton>Salvar alterações</SubmitButton>
                  </div>
                </form>

                <div className="mt-3 flex flex-wrap gap-3">
                  <form action={handleToggleServiceVisibility}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <input type="hidden" name="nextValue" value={service.is_active ? 'false' : 'true'} />
                    <SecondaryButton type="submit">{service.is_active ? 'Ocultar' : 'Publicar'}</SecondaryButton>
                  </form>
                  <form action={handleDeleteService}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <DangerButton type="submit">Excluir serviço</DangerButton>
                  </form>
                </div>
              </details>
            )) : <EmptyState title="Nenhum serviço cadastrado" description="Adicione os primeiros serviços para que eles apareçam na página pública." />}
          </div>
        </SectionCard>

        <SectionCard title="Novo serviço" description="Cadastre com preço, duração e categoria para melhorar agenda, vendas e controle financeiro.">
          <form action={handleCreateService} className="grid gap-4">
            <Field label="Nome"><Input name="name" /></Field>
            <Field label="Descrição"><Textarea name="description" rows={3} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Preço"><Input name="price" type="number" step="0.01" /></Field>
              <Field label="Duração (min)"><Input name="durationMinutes" type="number" defaultValue={60} /></Field>
            </div>
            <Field label="Categoria">
              <Select name="category" defaultValue="outros">
                {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked /> Ativo na página pública</label>
            <SubmitButton>Salvar serviço</SubmitButton>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
