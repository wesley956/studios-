import Link from 'next/link';

const valueCards = [
  {
    title: 'Agenda sem conflito',
    description: 'O cliente só consegue solicitar horários válidos, e o painel ajuda a evitar dois atendimentos no mesmo horário.'
  },
  {
    title: 'Página pública vendável',
    description: 'Cada negócio ganha um link próprio com serviços, horários, fotos, endereço e botão para solicitar atendimento.'
  },
  {
    title: 'Financeiro no controle',
    description: 'Veja entradas do dia e do mês, registre pagamentos e acompanhe o movimento sem depender de planilhas.'
  },
  {
    title: 'Admin para vender SaaS',
    description: 'Acompanhe clientes, cobranças, status da plataforma, uso por negócio e ações rápidas em uma área centralizada.'
  }
];

const featureGroups = [
  {
    label: 'Para o negócio',
    items: ['Clientes cadastrados', 'Serviços com preço e duração', 'Agenda organizada', 'Solicitações pendentes', 'Histórico de atendimentos']
  },
  {
    label: 'Para vender melhor',
    items: ['Página pública por link', 'Logo, capa e galeria', 'Temas por nicho', 'WhatsApp destacado', 'Horários de funcionamento']
  },
  {
    label: 'Para administrar',
    items: ['Painel admin', 'Cobranças mensais', 'Status por cliente', 'Plano único', 'Visão de uso da plataforma']
  }
];

const audiences = [
  {
    title: 'Barbearias',
    description: 'Visual forte, agenda por horário e presença online para facilitar marcações sem bagunçar o WhatsApp.',
    tone: 'Azul petróleo + grafite + dourado'
  },
  {
    title: 'Salões',
    description: 'Organização para serviços, clientes, agenda e página pública elegante para divulgar o atendimento.',
    tone: 'Nude premium + rosé + champanhe'
  },
  {
    title: 'Estética e studios',
    description: 'Experiência profissional para mostrar procedimentos, horários, fotos e receber solicitações com mais clareza.',
    tone: 'Lilás, verde, areia ou preto premium'
  }
];

const flowSteps = [
  'Você cadastra o cliente no painel admin.',
  'O negócio configura serviços, horários, fotos e página pública.',
  'A cliente final acessa o link e solicita um horário disponível.',
  'O dono aprova, conclui o atendimento e registra o pagamento.'
];

const faqs = [
  {
    question: 'O cliente precisa instalar aplicativo?',
    answer: 'Não. O sistema roda pelo navegador e funciona bem no celular, computador ou tablet.'
  },
  {
    question: 'Cada negócio tem seu próprio link?',
    answer: 'Sim. Cada cliente recebe uma página pública individual para divulgar serviços, horários, fotos e agendamento.'
  },
  {
    question: 'A agenda bloqueia horário ocupado?',
    answer: 'Sim. A proposta é evitar conflito entre solicitações, atendimentos já confirmados e horários indisponíveis.'
  },
  {
    question: 'O plano é único?',
    answer: 'Sim. O modelo atual é simples de vender: uma mensalidade com página pública, agenda, clientes, serviços e financeiro.'
  }
];

const stats = [
  { value: 'R$ 69,90', label: 'plano único mensal' },
  { value: '1 link', label: 'página pública por negócio' },
  { value: '5 áreas', label: 'agenda, clientes, serviços, financeiro e admin' }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <section className="relative overflow-hidden border-b border-cyan-300/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34rem),radial-gradient(circle_at_85%_20%,rgba(180,83,9,0.18),transparent_24rem),linear-gradient(135deg,#07111f_0%,#0b1627_48%,#111827_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-lg font-black text-cyan-200">
                S+
              </span>
              <span>
                <strong className="block text-base tracking-tight text-white">Studio+ Gestão</strong>
                <small className="text-xs text-slate-400">SaaS para negócios da beleza</small>
              </span>
            </Link>

            <nav className="flex flex-wrap gap-2 text-sm text-slate-300">
              <a href="#recursos" className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Recursos
              </a>
              <a href="#como-funciona" className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Como funciona
              </a>
              <a href="#preco" className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Plano
              </a>
              <Link href="/auth/login" className="rounded-full bg-cyan-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200">
                Entrar
              </Link>
            </nav>
          </header>

          <div className="grid gap-10 py-14 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-20">
            <div>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Gestão, agenda e página pública em um só sistema
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                Venda uma presença digital completa para barbearias, salões e studios.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                O Studio+ reúne página pública, agenda online, clientes, serviços, financeiro e painel administrativo para você vender um sistema simples de entender e forte no uso diário.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#preco"
                  className="rounded-2xl bg-cyan-300 px-6 py-4 text-center text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:-translate-y-0.5 hover:bg-cyan-200"
                >
                  Ver plano e proposta
                </a>
                <Link
                  href="/auth/login"
                  className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  Entrar na plataforma
                </Link>
                <Link
                  href="/admin"
                  className="rounded-2xl border border-white/12 px-6 py-4 text-center text-sm font-bold text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white"
                >
                  Painel admin
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <strong className="block text-xl text-white">{item.value}</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-[1.75rem] border border-white/10 bg-[#0b1627] p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Prévia do painel</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Visão do negócio</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-200">Online</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="text-xs text-slate-400">Hoje</span>
                    <strong className="mt-2 block text-2xl text-white">R$ 280</strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="text-xs text-slate-400">Mês</span>
                    <strong className="mt-2 block text-2xl text-white">R$ 4.820</strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="text-xs text-slate-400">Pedidos</span>
                    <strong className="mt-2 block text-2xl text-white">12</strong>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-cyan-100">Agenda</span>
                      <span className="text-xs text-slate-400">Hoje</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {['09:00 • Corte masculino', '11:30 • Design de sobrancelha', '15:00 • Limpeza de pele'].map((item) => (
                        <div key={item} className="rounded-xl bg-slate-950/35 px-3 py-3 text-sm text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-amber-100">Página pública</span>
                      <span className="text-xs text-slate-400">/studio-bella</span>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-950/35 p-4">
                      <div className="h-24 rounded-2xl bg-gradient-to-br from-cyan-300/35 via-slate-700 to-amber-300/25" />
                      <strong className="mt-4 block text-white">Studio Bella</strong>
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
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">O que mudou na proposta</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Menos bagunça no WhatsApp. Mais organização para atender e vender.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              A landing page agora posiciona o Studio+ como uma solução completa: o cliente final entende onde agenda, o dono do negócio entende o que controla e você consegue explicar o valor do produto com muito mais facilidade.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {valueCards.map((item) => (
              <article key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 shadow-xl shadow-black/10">
                <div className="mb-5 h-2 w-16 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300" />
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Sistema completo</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Tudo que o negócio precisa para começar organizado.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {featureGroups.map((group) => (
              <div key={group.label} className="rounded-[2rem] border border-white/10 bg-[#0b1627] p-6">
                <h3 className="text-xl font-semibold text-white">{group.label}</h3>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-[11px] font-black text-cyan-200">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {audiences.map((item) => (
            <article key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Para vender para</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              <p className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-xs leading-6 text-slate-300">
                Paleta sugerida: <strong className="text-white">{item.tone}</strong>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-cyan-300/10 via-white/[0.04] to-amber-300/10 p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Como funciona</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Um fluxo simples para você vender, configurar e acompanhar.</h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                A ideia é diminuir atrito: você cria o cliente, o cliente organiza o próprio negócio e a página pública já vira uma vitrine com agendamento.
              </p>
            </div>

            <div className="grid gap-4">
              {flowSteps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-[#07111f]/70 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">
                    {index + 1}
                  </span>
                  <p className="self-center text-sm leading-7 text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="preco" className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-stretch">
          <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.05] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Plano comercial</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Plano único, fácil de explicar e fácil de vender.</h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              Uma mensalidade para entregar página pública, agendamento online, clientes, serviços, financeiro e painel administrativo. Sem confundir o cliente com muitos planos logo no começo.
            </p>

            <div className="mt-8 rounded-[2rem] border border-cyan-300/25 bg-cyan-300/10 p-6">
              <p className="text-sm text-cyan-100">Mensalidade sugerida</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <strong className="text-5xl font-black text-white">R$ 69,90</strong>
                <span className="pb-2 text-sm text-slate-300">/mês por negócio</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-amber-300/20 bg-amber-300/[0.08] p-6 md:p-8">
            <h3 className="text-2xl font-semibold text-white">Incluído no plano</h3>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-200">
              {['Página pública personalizada', 'Solicitação de agendamento online', 'Agenda com controle de horários', 'Cadastro de clientes e serviços', 'Financeiro do negócio', 'Painel admin da plataforma'].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-300/20 text-[11px] font-black text-amber-100">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/auth/login"
              className="mt-8 block rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              Acessar plataforma
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-300 to-amber-200 p-1 shadow-2xl shadow-black/30">
          <div className="rounded-[2.35rem] bg-[#07111f] p-8 text-center md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Pronto para apresentar melhor</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Uma landing page mais forte para vender o Studio+ como produto profissional.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              Agora a primeira página explica melhor o valor do sistema, mostra os módulos principais e passa uma sensação mais premium, moderna e confiável.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/auth/login" className="rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                Entrar na plataforma
              </Link>
              <Link href="/admin" className="rounded-2xl border border-white/15 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10">
                Abrir painel admin
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
