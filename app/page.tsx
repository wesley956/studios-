import Link from 'next/link';

const features = [
  'Página pública profissional com agendamento inteligente',
  'Agenda com horários válidos e bloqueio de conflito',
  'Clientes e serviços com edição completa',
  'Financeiro com recebido hoje e no mês',
  'Registro de pagamento ao concluir atendimento',
  'Painel admin com visão real da plataforma'
];

const audiences = [
  { title: 'Barbearias', description: 'Visual mais forte, premium e alinhado ao nicho masculino.' },
  { title: 'Salões', description: 'Experiência elegante, profissional e pronta para vender.' },
  { title: 'Estética e studios', description: 'Organização, presença digital e atendimento com hora marcada.' }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <section className="public-hero-overlay border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+ Gestão</p>

              <h1 className="mt-4 text-4xl font-serif leading-tight md:text-6xl">
                Agenda inteligente, financeiro claro e apresentação profissional para negócios da beleza.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-muted md:text-lg">
                Plataforma completa para studios, barbearias, salões e profissionais da beleza com painel do cliente,
                painel admin, página pública, agendamento organizado e visão real do que entra no dia e no mês.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Entrar na plataforma
                </Link>

                <Link
                  href="/admin"
                  className="rounded-2xl border border-border bg-surface px-6 py-3 text-sm font-medium transition hover:bg-primary-soft"
                >
                  Painel admin
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted">
                <span className="rounded-full border border-border bg-surface px-4 py-2">Plano único</span>
                <span className="rounded-full border border-border bg-surface px-4 py-2">R$ 69,90/mês</span>
                <span className="rounded-full border border-border bg-surface px-4 py-2">Página pública + agenda</span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-soft">
              <div className="rounded-[1.75rem] border border-border bg-[var(--theme-surface-alt)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">O que esse produto entrega</p>

                <div className="mt-5 grid gap-3">
                  {features.map((item) => (
                    <div key={item} className="rounded-[1.25rem] border border-border bg-surface px-4 py-3 text-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {audiences.map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-soft">
              <h2 className="text-2xl font-serif">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-2 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-surface p-8 shadow-soft">
          <div className="grid gap-8 lg:grid-cols-[1fr,0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Posicionamento</p>
              <h2 className="mt-4 text-3xl font-serif md:text-4xl">
                Um sistema simples de vender, bonito de apresentar e forte no uso diário.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                Você não está vendendo só uma agenda. Está vendendo organização, presença digital, atendimento com hora
                marcada e clareza financeira para o negócio da cliente.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-border bg-[var(--theme-surface-alt)] p-6">
              <p className="text-sm text-muted">Modelo comercial atual</p>
              <p className="mt-2 text-3xl font-semibold">Plano único — R$ 69,90/mês</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Agenda, clientes, serviços, página pública, agendamento online, financeiro e painel admin em uma única
                solução.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
