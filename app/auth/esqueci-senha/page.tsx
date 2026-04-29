import Link from 'next/link';
import { requestPasswordRecovery } from '@/actions/auth';
import { Field, Input, SubmitButton } from '@/components/shared/forms';

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-surface p-7 shadow-soft md:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+ Gestão</p>
        <h1 className="mt-3 text-3xl font-serif">Recuperar senha</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Informe o e-mail do acesso. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha.
        </p>

        {params?.error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{params.error}</div>
        ) : null}

        {params?.success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {params.success}
          </div>
        ) : null}

        <form action={requestPasswordRecovery} className="mt-7 grid gap-4">
          <Field label="E-mail de acesso">
            <Input name="email" type="email" required placeholder="cliente@studio.com" autoComplete="email" />
          </Field>

          <SubmitButton>Enviar link de recuperação</SubmitButton>
        </form>

        <Link href="/auth/login" className="mt-6 inline-block text-sm font-medium text-primary transition hover:opacity-80">
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
