import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/types/app';

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  return user;
}

export async function getProfile() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

export async function requireRole(role: Role) {
  const { user, profile } = await getProfile();

  if (!profile) {
    redirect('/auth/login?error=perfil');
  }

  if (profile.role !== role) {
    redirect(profile.role === 'admin' ? '/admin' : '/app');
  }

  return { user, profile };
}

export async function requireAdmin() {
  return requireRole('admin');
}

export async function requireClientOwner() {
  return requireRole('client_owner');
}

export async function getCurrentBusiness() {
  const { user } = await requireClientOwner();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    redirect('/auth/login?error=negocio');
  }

  return business;
}
