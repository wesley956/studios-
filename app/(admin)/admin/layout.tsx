import { ReactNode } from 'react';
import { SidebarLayout } from '@/components/shared/shell';

const nav = [
  { href: '/admin', label: 'Dashboard', helper: 'Resumo, alertas e atalhos principais' },
  { href: '/admin/clientes', label: 'Clientes', helper: 'Lista, filtros, status e ações' },
  { href: '/admin/financeiro', label: 'Financeiro', helper: 'Cobranças, pagamentos e pendências' },
  { href: '/admin/uso', label: 'Uso da plataforma', helper: 'Atividade, agenda e crescimento' },
  { href: '/admin/clientes/novo', label: 'Novo cliente', helper: 'Cadastrar acesso e negócio' }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SidebarLayout title="Admin Studio+" nav={nav} tone="admin">{children}</SidebarLayout>;
}
