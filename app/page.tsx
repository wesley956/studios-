import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f7f2ec_0%,#efe2d6_100%)] px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted">Studio+ Gestão</p>
          <h1 className="text-5xl leading-tight md:text-6xl">Agenda inteligente, financeiro claro e mini site profissional para studios.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Plataforma completa para negócios da beleza com área pública, painel do cliente, painel admin, agenda sem conflito e visão real do que entra no dia e no mês.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/login" className="rounded-2xl bg-primary px-6 py-3 text-white">Entrar</Link>
            <Link href="/admin" className="rounded-2xl border border-border bg-white px-6 py-3">Painel admin</Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <h2 className="text-2xl">O que esse produto entrega</h2>
          <ul className="mt-4 space-y-3 text-muted">
            <li>• Página pública profissional com agendamento inteligente</li>
            <li>• Agenda com horários válidos e bloqueio de conflito</li>
            <li>• Clientes e serviços com edição completa</li>
            <li>• Dashboard com recebido hoje e recebido no mês</li>
            <li>• Registro de pagamento ao concluir atendimento</li>
            <li>• Painel admin com visão de operação e receita</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
