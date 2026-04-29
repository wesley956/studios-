'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { getAppUrl } from '@/lib/utils';

function redirectWithFeedback(path: string, key: 'success' | 'error', message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

export async function requestPasswordRecovery(formData: FormData): Promise<void> {
  const email = String(formData.get('email') || '').trim().toLowerCase();

  if (!email) {
    redirectWithFeedback('/auth/esqueci-senha', 'error', 'Informe seu e-mail para recuperar a senha.');
  }

  const supabase = await createClient();
  const redirectTo = `${getAppUrl()}/auth/atualizar-senha`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  await logAuditEvent({
    action: 'auth.password_recovery_requested',
    entityType: 'profile',
    metadata: { email }
  });

  if (error) {
    redirectWithFeedback('/auth/esqueci-senha', 'error', `Não foi possível enviar o link: ${error.message}`);
  }

  redirectWithFeedback(
    '/auth/esqueci-senha',
    'success',
    'Se esse e-mail estiver cadastrado, o link de recuperação será enviado em alguns instantes.'
  );
}
