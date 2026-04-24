import { createFirstAdmin } from '@/actions/setup';
import { Field, Input, SubmitButton } from '@/components/shared/forms';
import { createClient } from '@/lib/supabase/server';

export default async function SetupPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');

  async function handleCreateFirstAdmin(formData: FormData): Promise<void> {
    'use server';
    await createFirstAdmin(formData);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <div className="w-full rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Studio+</p>
        <h1 className="mt-3 text-3xl">Configuração inicial</h1>

        {(count || 0) > 0 ? (
          <p className="mt-4 text-muted">Já existe um administrador cadastrado. Você pode entrar normalmente em <strong>/auth/login</strong>.</p>
        ) : (
          <form action={handleCreateFirstAdmin} className="mt-8 grid gap-4">
            <Field label="Seu nome">
              <Input name="fullName" />
            </Field>
            <Field label="Seu e-mail">
              <Input name="email" type="email" />
            </Field>
            <Field label="Senha do admin">
              <Input name="password" type="password" />
            </Field>
            <SubmitButton>Criar primeiro admin</SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
