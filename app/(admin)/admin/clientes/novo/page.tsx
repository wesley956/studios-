import { createBusiness } from '@/actions/admin-businesses';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { SectionCard, TopHeading } from '@/components/shared/shell';
import { requireAdmin } from '@/lib/auth';
import { BUSINESS_TYPE_OPTIONS, THEME_OPTIONS, getSuggestedThemeByBusinessType } from '@/lib/themes';
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
        title="Criar novo cliente"
        description="Cadastre o acesso da dona do negócio e monte o studio já com plano único, tipo de negócio e tema visual inicial."
      />

      <form action={handleCreateBusiness} className="space-y-6">
        <SectionCard
          title="Plano comercial"
          description="Nesta versão do produto, todos os clientes entram no mesmo plano."
        >
          <input type="hidden" name="planName" value={SINGLE_PLAN_KEY} />

          <div className="rounded-2xl border border-primary/15 bg-primary-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Plano ativo</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-2xl font-serif">{SINGLE_PLAN_LABEL}</h3>
                <p className="mt-1 text-sm text-muted">
                  Inclui agenda, clientes, serviços, página pública e financeiro.
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white px-5 py-4">
                <p className="text-sm text-muted">Preço mensal</p>
                <p className="mt-1 text-2xl font-semibold">{currencyBRL(SINGLE_PLAN_PRICE)}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Responsável pelo studio"
          description="Se você informar nome, e-mail e senha, o sistema já cria o acesso completo da dona do negócio."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da responsável">
              <Input name="ownerName" placeholder="Ex.: Maria Oliveira" />
            </Field>

            <Field label="E-mail da responsável">
              <Input name="ownerEmail" type="email" placeholder="cliente@studio.com" />
            </Field>

            <Field label="Senha inicial" className="md:col-span-2" hint="Essa senha poderá ser alterada depois pela cliente.">
              <Input name="ownerPassword" type="password" placeholder="Defina uma senha inicial" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Dados do negócio"
          description="Esses dados formam a base do painel, da página pública e do estilo inicial do studio."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do negócio">
              <Input name="businessName" placeholder="Ex.: Studio da Maria" required />
            </Field>

            <Field label="Slug público" hint="Vai virar a URL pública do negócio. Ex.: studio-da-maria">
              <Input name="slug" placeholder="studio-da-maria" />
            </Field>

            <Field label="Tipo do negócio">
              <Select name="businessType" defaultValue="studio_geral">
                {BUSINESS_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tema visual inicial" hint="A cliente poderá trocar depois nas configurações.">
              <Select name="themeKey" defaultValue={getSuggestedThemeByBusinessType('studio_geral')}>
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Cidade">
              <Input name="city" placeholder="Ex.: Nova Odessa" />
            </Field>

            <Field label="WhatsApp">
              <Input name="whatsapp" placeholder="(19) 99999-9999" />
            </Field>

            <Field label="Instagram">
              <Input name="instagram" placeholder="@studio" />
            </Field>

            <Field label="Status inicial">
              <Select name="status" defaultValue="trial">
                <option value="trial">Teste</option>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
              </Select>
            </Field>

            <Field label="Endereço" className="md:col-span-2">
              <Input name="address" placeholder="Rua, número, bairro..." />
            </Field>

            <Field label="Tagline" className="md:col-span-2" hint="Frase curta para destacar a proposta do negócio.">
              <Input name="tagline" placeholder="Ex.: Seu horário, sua beleza, seu momento." />
            </Field>

            <Field label="Descrição" className="md:col-span-2">
              <Textarea
                name="description"
                rows={4}
                placeholder="Descreva o negócio, estilo de atendimento e diferenciais."
              />
            </Field>
          </div>
        </SectionCard>

        <div>
          <SubmitButton>Criar cliente completo</SubmitButton>
        </div>
      </form>
    </div>
  );
}
