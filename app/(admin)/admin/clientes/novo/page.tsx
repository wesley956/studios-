import { createBusiness } from '@/actions/admin-businesses';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { SectionCard, TopHeading } from '@/components/shared/shell';
import { requireAdmin } from '@/lib/auth';
import { SINGLE_PLAN_KEY, SINGLE_PLAN_LABEL, SINGLE_PLAN_PRICE } from '@/lib/validations/business';
import { currencyBRL } from '@/lib/utils';

export default async function NovoClientePage() {
  await requireAdmin();

  async function handleCreateBusiness(formData: FormData): Promise<void> {
    'use server';
    await createBusiness(formData);
  }

  return (
    <div>
      <TopHeading
        title="Novo cliente"
        description="Crie o acesso da dona do negócio e o studio completo em um só passo. A plataforma agora trabalha com um único plano comercial."
      />

      <form action={handleCreateBusiness} className="grid gap-6">
        <input type="hidden" name="planName" value={SINGLE_PLAN_KEY} />

        <SectionCard title="Modelo comercial" description="Sem escolha de planos na venda: cobrança simples e direta.">
          <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
            <div>
              <p className="text-lg font-medium">{SINGLE_PLAN_LABEL}</p>
              <p className="mt-1 text-sm text-muted">Inclui agenda, clientes, serviços, página pública e financeiro.</p>
            </div>
            <div className="rounded-2xl border border-border bg-[#F7F3EE] px-5 py-4 text-right">
              <p className="text-sm text-muted">Preço mensal</p>
              <p className="mt-1 text-2xl font-semibold">{currencyBRL(SINGLE_PLAN_PRICE)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Acesso da cliente" description="Esses dados serão usados para criar o login da dona do studio.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Nome da responsável">
              <Input name="ownerName" />
            </Field>
            <Field label="E-mail da responsável">
              <Input name="ownerEmail" type="email" />
            </Field>
            <Field label="Senha inicial">
              <Input name="ownerPassword" type="password" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Dados do negócio" description="Você pode preencher o nome e o sistema usa isso para ajudar no slug.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do negócio">
              <Input name="businessName" />
            </Field>
            <Field label="Slug público">
              <Input name="slug" placeholder="ex: studio-bella" />
            </Field>
            <Field label="Cidade">
              <Input name="city" />
            </Field>
            <Field label="WhatsApp">
              <Input name="whatsapp" />
            </Field>
            <Field label="Instagram">
              <Input name="instagram" />
            </Field>
            <Field label="Status inicial">
              <Select name="status" defaultValue="trial">
                <option value="trial">Teste</option>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Tagline pública" hint="Frase curta que aparece na página pública.">
                <Input name="tagline" placeholder="Sua agenda organizada e seus atendimentos sob controle." />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Endereço">
                <Input name="address" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Descrição">
                <Textarea name="description" rows={5} />
              </Field>
            </div>
          </div>
        </SectionCard>

        <div>
          <SubmitButton>Criar cliente completo</SubmitButton>
        </div>
      </form>
    </div>
  );
}
