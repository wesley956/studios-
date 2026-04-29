import Link from 'next/link';

const clientFeatures = [
  {
    title: 'Agenda organizada',
    description: 'Acompanhe solicitações, aprove horários e mantenha seus atendimentos visíveis em uma rotina simples.'
  },
  {
    title: 'Clientes em ordem',
    description: 'Cadastre contatos, histórico e informações importantes para atender melhor sem depender de anotações soltas.'
  },
  {
    title: 'Serviços e valores',
    description: 'Mantenha seus serviços atualizados com preço, duração e status para facilitar o agendamento.'
  },
  {
    title: 'Financeiro do negócio',
    description: 'Registre pagamentos, acompanhe o recebido no dia e veja uma visão mais clara do movimento do mês.'
  },
  {
    title: 'Página pública',
    description: 'Divulgue seu link com serviços, fotos, endereço, horários de funcionamento e botão para solicitar atendimento.'
  },
  {
    title: 'Configurações simples',
    description: 'Atualize logo, capa, galeria, tema visual, descrição, WhatsApp e dados principais do seu negócio.'
  }
];

const quickActions = [
  'Ver solicitações pendentes',
  'Conferir agenda do dia',
  'Cadastrar ou editar serviços',
  'Atualizar fotos da página pública',
  'Registrar pagamento de atendimento',
  'Conferir recebido hoje e no mês'
];

const useSteps = [
  {
    number: '01',
    title: 'Entre no painel',
    description: 'Use o e-mail e a senha cadastrados para acessar sua área de gestão.'
  },
  {
    number: '02',
    title: 'Configure seu negócio',
    description: 'Revise serviços, horários de funcionamento, fotos, WhatsApp e informações públicas.'
  },
  {
    number: '03',
    title: 'Compartilhe seu link',
    description: 'Envie a página pública para clientes solicitarem atendimento pelos horários disponíveis.'
  },
  {
    number: '04',
    title: 'Acompanhe tudo',
    description: 'Aprove solicitações, conclua atendimentos e registre pagamentos no próprio sistema.'
  }
];

const supportItems = [
  {
    title: 'Não encontrou uma informação?',
    description: 'Comece pelo menu lateral do painel. As áreas principais são Agenda, Solicitações, Clientes, Serviços, Financeiro e Configurações.'
  },
  {
    title: 'Precisa alterar dados públicos?',
    description: 'Entre em Configurações para atualizar fotos, descrição, endereço, WhatsApp, tema visual e horários de funcionamento.'
  },
  {
    title: 'Solicitação não apareceu?',
    description: 'Confira se a página pública está ativa, se os serviços estão cadastrados e se existem horários de funcionamento disponíveis.'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#06101d] text-slate-100">
      <section className="relative overflow-hidden border-b border-cyan-300/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_34rem),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.16),transparent_25rem),linear-gradient(135deg,#06101d_0%,#0b1728_48%,#111827_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/25 backdrop-blur md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-lg font-black text-cyan-200">
                S+
              </span>
              <span>
                <strong className="block text-base tracking-tight text-white">Studio+ Gestão</strong>
                <small className="text-xs text-slate-400">Portal dos clientes</small>
              </span>
            </Link>

            <nav className="flex flex-wrap gap-2 text-sm text-slate-300">
              <a href="#recursos" className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Recursos
              </a>
              <a href="#como-usar" className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Como usar
              </a>
              <a href="#ajuda" className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Ajuda rápida
              </a>
              <Link href="/admin" className="rounded-full border border-white/12 px-4 py-2 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                Área admin
              </Link>
              <Link href="/auth/login" className="rounded-full bg-cyan-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200">
                Entrar no painel
              </Link>
            </nav>
          </header>

          <div className="grid gap-10 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
            <div>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Área de acesso dos clientes Studio+
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                Organize sua agenda, seus clientes e seus atendimentos em um só lugar.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                Esta é a porta de entrada para clientes Studio+. Acesse seu painel para cuidar da agenda, aprovar solicitações, atualizar serviços, acompanhar pagamentos e manter sua página pública pronta para receber novos pedidos.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/login"
                  className="rounded-2xl bg-cyan-300 px-6 py-4 text-center text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:-translate-y-0.5 hover:bg-cyan-200"
                >
                  Entrar no meu painel
                </Link>
                <a
                  href="#como-usar"
                  className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  Ver como usar
                </a>
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-sm font-semibold text-white">Primeiro acesso?</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Use o e-mail e a senha enviados no cadastro. Depois de entrar, revise seus serviços, horários de funcionamento, fotos e dados de contato.
                </p>
              </div>
            </div>

            <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-[1.75rem] border border-white/10 bg-[#0b1627] p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Resumo do painel</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Rotina do negócio</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-200">Ativo</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="text-xs text-slate-400">Hoje</span>
                    <strong className="mt-2 block text-2xl text-white">Agenda</strong>
                    <span className="mt-1 block text-xs text-slate-400">atendimentos do dia</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="text-xs text-slate-400">Pedidos</span>
                    <strong className="mt-2 block text-2xl text-white">Solicitações</strong>
                    <span className="mt-1 block text-xs text-slate-400">para aprovar</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="text-xs text-slate-400">Mês</span>
                    <strong className="mt-2 block text-2xl text-white">Financeiro</strong>
                    <span className="mt-1 block text-xs text-slate-400">entradas registradas</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-cyan-100">Ações rápidas</span>
                      <span className="text-xs text-slate-400">Painel</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {['Aprovar solicitação', 'Concluir atendimento', 'Registrar pagamento'].map((item) => (
                        <div key={item} className="rounded-xl bg-slate-950/35 px-3 py-3 text-sm text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-300/15 bg-blue-300/[0.07] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-100">Página pública</span>
                      <span className="text-xs text-slate-400">Link do negócio</span>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-950/35 p-4">
                      <div className="h-24 rounded-2xl bg-gradient-to-br from-cyan-300/35 via-slate-700 to-blue-300/25" />
                      <strong className="mt-4 block text-white">Seu negócio online</strong>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Serviços, horários, endereço, fotos e botão para solicitar atendimento.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">O que você controla</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Informações importantes, separadas por área.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            A página inicial agora foi pensada para orientar quem já é cliente do Studio+, mostrando o que pode ser feito dentro do painel sem parecer uma página de venda aberta.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientFeatures.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 shadow-xl shadow-black/10">
              <div className="mb-5 h-2 w-16 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" />
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Para não se perder</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                O que conferir quando entrar no sistema.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Use essa lista como um guia rápido. Ela ajuda a encontrar as informações principais sem precisar procurar em várias telas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-[#0b1627] p-4 text-sm leading-6 text-slate-200">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-[11px] font-black text-cyan-200">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="como-usar" className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-cyan-300/10 via-white/[0.04] to-blue-300/10 p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Como usar</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Um fluxo simples para manter seu negócio atualizado.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                A rotina ideal é revisar as solicitações, manter a agenda em dia e atualizar sua página pública sempre que houver mudança de serviço, horário ou foto.
              </p>
            </div>

            <div className="grid gap-4">
              {useSteps.map((step) => (
                <div key={step.number} className="flex gap-4 rounded-2xl border border-white/10 bg-[#07111f]/70 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ajuda" className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {supportItems.map((item) => (
            <article key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Ajuda rápida</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-300 to-blue-500 p-1 shadow-2xl shadow-black/30">
          <div className="rounded-[2.35rem] bg-[#07111f] p-8 text-center md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Acesso do cliente</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Entre no painel e mantenha seu negócio organizado hoje.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              Sua página pública, agenda, clientes, serviços e financeiro ficam reunidos em uma área simples para o dia a dia.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/auth/login" className="rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                Entrar no meu painel
              </Link>
              <Link href="/admin" className="rounded-2xl border border-white/15 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10">
                Área do administrador
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
