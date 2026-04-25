import type { ReactNode } from 'react';
import { SidebarLayout } from '@/components/shared/shell';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { buildThemeStyleVars, getSuggestedThemeByBusinessType } from '@/lib/themes';

const nav = [
  { href: '/app', label: 'Dashboard', helper: 'Resumo do negócio' },
  { href: '/app/agenda', label: 'Agenda', helper: 'Horários, conflito e conclusão' },
  { href: '/app/clientes', label: 'Clientes', helper: 'Cadastro, busca e histórico' },
  { href: '/app/servicos', label: 'Serviços', helper: 'Catálogo e precificação' },
  { href: '/app/solicitacoes', label: 'Solicitações', helper: 'Pedidos vindos da página pública' },
  { href: '/app/financeiro', label: 'Financeiro', helper: 'Recebimentos e ticket médio' },
  { href: '/app/configuracoes', label: 'Configurações', helper: 'Marca, agenda e horários' }
];

export default async function ClientLayout({ children }: { children: ReactNode }) {
  await requireClientOwner();
  const business = await getCurrentBusiness();

  const themeKey = business.theme_key || getSuggestedThemeByBusinessType(business.business_type);
  const themeVars = buildThemeStyleVars(themeKey);
  const isBarber = business.business_type === 'barbearia';

  return (
    <div
      style={themeVars}
      className={`min-h-screen bg-background text-text transition-colors ${isBarber ? 'barber-texture' : ''}`}
    >
      <SidebarLayout title={business.business_name || 'Studio+'} nav={nav} tone="client">
        <div className="space-y-6">{children}</div>
      </SidebarLayout>
    </div>
  );
}
