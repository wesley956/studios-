'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function createFirstAdmin(formData: FormData): Promise<void> {
  const fullName = String(formData.get('fullName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!fullName || !email || !password) {
    throw new Error('Preencha nome, e-mail e senha.');
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');

  if ((count || 0) > 0) {
    throw new Error('Já existe um administrador cadastrado.');
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Não foi possível criar o admin.');
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    role: 'admin'
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath('/setup');
}
