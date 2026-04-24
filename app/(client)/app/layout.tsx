import { ReactNode } from 'react';
import { SidebarLayout } from '@/components/shared/shell';

const nav = [
  { href: '/app', label: 'Dashboard', helper: 'Resumo do negócio' },
  { href: '/app/agenda', label: 'Agenda', helper: 'Horários, conflito e conclusão' },
  { href: '/app/clientes', label: 'Clientes', helper: 'Cadastro, busca e histórico' },
  { href: '/app/servicos', label: 'Serviços', helper: 'Catálogo e precificação' },
  { href: '/app/solicitacoes', label: 'Solicitações', helper: 'Pedidos vindos da página pública' },
  { href: '/app/financeiro', label: 'Financeiro', helper: 'Recebimentos e ticket médio' },
  { href: '/app/configuracoes', label: 'Configurações', helper: 'Marca, agenda e horários' }
];

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <SidebarLayout title="Painel do Studio" nav={nav}>{children}</SidebarLayout>;
}
