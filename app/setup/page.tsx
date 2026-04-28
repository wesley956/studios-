import Link from 'next/link';
import { createFirstAdmin } from '@/actions/setup';
import { Field, Input, SubmitButton } from '@/components/shared/forms';
import { createAdminClient } from '@/lib/supabase/admin';

type SetupPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === 'string' ? params.error : null;

  let adminCount = 0;
  let setupError: string | null = null;

  try {
    const admin = createAdminClient();

    const { count, error } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (error) {
      setupError = error.message;
    } else {
      adminCount = count || 0;
    }
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido ao verificar administradores.';
  }

  const hasAdmin = adminCount > 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <div className="w-full rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Studio+</p>
        <h1 className="mt-3 text-3xl">Configuração inicial</h1>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {setupError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            Erro ao verificar o setup: {setupError}
          </div>
        ) : null}

        {hasAdmin ? (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700">
            Já existe um administrador cadastrado. Você pode entrar normalmente em{' '}
            <Link href="/auth/login" className="font-semibold underline">
              /auth/login
            </Link>
            .
          </div>
        ) : (
          <form action={createFirstAdmin} className="mt-8 grid gap-4">
            <Field label="Seu nome">
              <Input name="fullName" required />
            </Field>

            <Field label="Seu e-mail">
              <Input name="email" type="email" required />
            </Field>

            <Field label="Senha do admin">
              <Input name="password" type="password" minLength={6} required />
            </Field>

            <SubmitButton>Criar primeiro admin</SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
