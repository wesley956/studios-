import { createBusiness } from '@/actions/admin-businesses';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { TopHeading, SectionCard } from '@/components/shared/shell';
import { requireAdmin } from '@/lib/auth';

export default async function NovoClientePage() {
  await requireAdmin();

  async function handleCreateBusiness(formData: FormData): Promise<void> {
    'use server';
    await createBusiness(formData);
  }

  return (
    <div>
      <TopHeading title="Novo cliente" description="Crie o acesso da dona do negócio, o studio e a base inicial em um único fluxo profissional." />
      <form action={handleCreateBusiness} className="grid gap-6">
        <SectionCard title="Acesso da cliente" description="Esses dados serão usados para criar o login da responsável pelo studio.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Nome da responsável"><Input name="ownerName" /></Field>
            <Field label="E-mail da responsável"><Input name="ownerEmail" type="email" /></Field>
            <Field label="Senha inicial"><Input name="ownerPassword" type="password" /></Field>
          </div>
        </SectionCard>

        <SectionCard title="Dados do negócio" description="Você pode preencher o essencial agora e completar o resto depois no painel da cliente.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do negócio"><Input name="businessName" /></Field>
            <Field label="Slug"><Input name="slug" placeholder="ex: studio-bella" /></Field>
            <Field label="Tagline"><Input name="tagline" placeholder="Ex.: Atendimento premium com hora marcada" /></Field>
            <Field label="Cidade"><Input name="city" /></Field>
            <Field label="WhatsApp"><Input name="whatsapp" /></Field>
            <Field label="Instagram"><Input name="instagram" /></Field>
            <Field label="Plano">
              <Select name="planName" defaultValue="start">
                <option value="start">Start</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue="trial">
                <option value="trial">Teste</option>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
              </Select>
            </Field>
            <Field label="Endereço" className="md:col-span-2"><Input name="address" /></Field>
            <Field label="Descrição" className="md:col-span-2"><Textarea name="description" rows={4} /></Field>
          </div>
        </SectionCard>

        <div><SubmitButton>Criar cliente completo</SubmitButton></div>
      </form>
    </div>
  );
}
