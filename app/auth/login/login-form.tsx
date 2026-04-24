'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Field, Input, SubmitButton } from '@/components/shared/forms';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get('next') || null;

  async function handleSubmit(formData: FormData) {
    setError(null);

    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');

    const { error: signInError, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError('Não foi possível entrar. Confira e-mail e senha e tente novamente.');
      return;
    }

    if (!data.user) {
      setError('Não foi possível entrar.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

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
    <form action={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted">Studio+ Gestão</p>
        <h1 className="text-3xl md:text-4xl">Entrar na plataforma</h1>
        <p className="mt-2 text-sm text-muted">
          Acesse o painel para controlar agenda, clientes, serviços, solicitações e financeiro do seu negócio.
        </p>
      </div>

      <Field label="E-mail">
        <Input name="email" type="email" placeholder="seuemail@studio.com" required />
      </Field>

      <Field label="Senha">
        <Input name="password" type="password" placeholder="Sua senha" required />
      </Field>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <SubmitButton className="w-full">Entrar</SubmitButton>
    </form>
  );
}
