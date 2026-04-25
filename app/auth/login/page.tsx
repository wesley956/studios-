import { Suspense } from 'react';
import LoginForm from './login-form';

const highlights = [
  'Agenda com bloqueio de conflito',
  'Clientes e serviços com edição completa',
  'Financeiro com recebido hoje e no mês',
  'Página pública com agendamento inteligente'
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr,0.9fr]">
        <section className="public-hero-overlay flex items-center border-b border-border px-6 py-12 lg:border-b-0 lg:border-r lg:px-10 xl:px-14">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+ Gestão</p>

            <h1 className="mt-4 text-4xl font-serif leading-tight md:text-5xl">
              O sistema profissional para agenda, clientes, financeiro e presença digital.
            </h1>

            <p className="mt-5 text-base leading-8 text-muted">
              Organize seu studio com uma plataforma bonita, rápida e pronta para vender: página pública, solicitações
              de horário, agenda sem conflito e visão clara do que entra no dia e no mês.
            </p>

            <div className="mt-8 grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-border bg-surface px-4 py-3 text-sm shadow-soft">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm font-medium">Acesso organizado por perfil</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Clientes entram no painel do studio. Administradores entram no painel completo da plataforma.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-12 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-xl">
            <Suspense fallback={<div className="text-sm text-muted">Carregando login...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
