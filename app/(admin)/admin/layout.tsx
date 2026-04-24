import { ReactNode } from 'react';
import { SidebarLayout } from '@/components/shared/shell';

const nav = [
  { href: '/admin', label: 'Dashboard', helper: 'Saúde da plataforma' },
  { href: '/admin/clientes', label: 'Clientes', helper: 'Busca, filtros e ações' },
  { href: '/admin/financeiro', label: 'Financeiro', helper: 'Receita estimada e planos' },
  { href: '/admin/uso', label: 'Uso da plataforma', helper: 'Atividade e crescimento' },
  { href: '/admin/clientes/novo', label: 'Novo cliente', helper: 'Criação completa' }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SidebarLayout title="Admin Studio+" nav={nav} tone="admin">{children}</SidebarLayout>;
}
