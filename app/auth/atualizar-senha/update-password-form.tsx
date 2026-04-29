'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { Field, Input, SubmitButton } from '@/components/shared/forms';

export default function UpdatePasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') || '').trim();
    const confirmPassword = String(formData.get('confirmPassword') || '').trim();

    if (password.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'Não foi possível atualizar a senha. Abra o link novamente e tente outra vez.');
      setIsSubmitting(false);
      return;
    }

    setSuccess('Senha atualizada com sucesso. Você já pode entrar com a nova senha.');
    setIsSubmitting(false);
  }

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-soft md:p-9">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+ Gestão</p>
      <h1 className="mt-3 text-3xl font-serif">Criar nova senha</h1>
      <p className="mt-3 text-sm leading-7 text-muted">Digite sua nova senha para recuperar o acesso ao painel.</p>

      {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {success ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
        <Field label="Nova senha">
          <Input name="password" type="password" minLength={6} required autoComplete="new-password" />
        </Field>
        <Field label="Confirmar nova senha">
          <Input name="confirmPassword" type="password" minLength={6} required autoComplete="new-password" />
        </Field>
        <SubmitButton disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar nova senha'}</SubmitButton>
      </form>

      <Link href="/auth/login" className="mt-6 inline-block text-sm font-medium text-primary transition hover:opacity-80">
        Ir para o login
      </Link>
    </div>
  );
}
