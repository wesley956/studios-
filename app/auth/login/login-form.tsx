'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Field, Input, SubmitButton } from '@/components/shared/forms';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get('next') || null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();

    const { error: signInError, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError('Não foi possível entrar. Confira e-mail e senha e tente novamente.');
      setIsSubmitting(false);
      return;
    }

    if (!data.user) {
      setError('Não foi possível entrar.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

    if (nextPath) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    if (profile?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/app');
    }

    router.refresh();
  }

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-soft md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+ Gestão</p>
        <h2 className="mt-3 text-3xl font-serif">Entrar na plataforma</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Acesse o painel para controlar agenda, clientes, serviços, solicitações e financeiro do seu negócio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Field label="E-mail">
          <Input name="email" type="email" placeholder="seuemail@studio.com" required autoComplete="email" />
        </Field>

        <Field label="Senha">
          <Input name="password" type="password" placeholder="Digite sua senha" required autoComplete="current-password" />
        </Field>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="pt-2">
          <SubmitButton className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </SubmitButton>
        </div>
      </form>

      <div className="mt-6 rounded-[1.5rem] border border-border bg-[var(--theme-surface-alt)] p-4">
        <p className="text-sm font-medium">Acesso por perfil</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Admin entra no painel completo. Cliente entra no painel do studio com agenda, serviços, clientes e financeiro.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/" className="font-medium text-primary transition hover:opacity-80">
          Voltar para a apresentação
        </Link>
      </div>
    </div>
  );
}
