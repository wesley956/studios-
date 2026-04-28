'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

function fail(message: string): never {
  redirect(`/setup?error=${encodeURIComponent(message)}`);
}

export async function createFirstAdmin(formData: FormData): Promise<void> {
  const fullName = String(formData.get('fullName') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '').trim();

  if (!fullName || !email || !password) {
    fail('Preencha nome, e-mail e senha.');
  }

  if (password.length < 6) {
    fail('A senha precisa ter pelo menos 6 caracteres.');
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch {
    fail('As variáveis do Supabase admin não foram configuradas corretamente.');
  }

  const { count, error: countError } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');

  if (countError) {
    fail(`Erro ao verificar administradores: ${countError.message}`);
  }

  if ((count || 0) > 0) {
    fail('Já existe um administrador cadastrado. Entre pela tela de login.');
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  });

  if (error || !data.user) {
    const message = error?.message || 'Não foi possível criar o admin.';

    if (
      message.toLowerCase().includes('already') ||
      message.toLowerCase().includes('registered') ||
      message.toLowerCase().includes('exists')
    ) {
      fail('Esse e-mail já existe em Authentication > Users no Supabase. Apague esse usuário lá ou use outro e-mail.');
    }

    fail(`Erro do Supabase Auth: ${message}`);
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName,
      role: 'admin'
    },
    {
      onConflict: 'id'
    }
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    fail(`Erro ao criar perfil do admin: ${profileError.message}`);
  }

  revalidatePath('/setup');
  redirect('/auth/login?success=admin-criado');
}
