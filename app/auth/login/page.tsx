import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f7f2ec_0%,#efe2d6_100%)] px-6 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
        <section className="rounded-[2rem] border border-border bg-dark p-8 text-white shadow-sm lg:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-white/60">Studio+ Gestão</p>
          <h1 className="mt-4 text-4xl leading-tight lg:text-5xl">O sistema profissional para agenda, clientes, financeiro e presença digital.</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Organize seu studio com uma plataforma bonita, rápida e pronta para vender: página pública, solicitações de horário, agenda sem conflito e visão clara do que entra no dia e no mês.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              'Agenda com bloqueio de conflito',
              'Clientes e serviços com edição completa',
              'Financeiro com recebido hoje e no mês',
              'Painel admin com visão da plataforma'
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/80">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm lg:p-10">
          <Suspense fallback={<div className="text-sm text-muted">Carregando login...</div>}>
            <LoginForm />
          </Suspense>
          <div className="mt-6 rounded-2xl bg-[#FBF7F3] p-4 text-sm text-muted">
            <p className="font-medium text-dark">Acesso organizado por perfil</p>
            <p className="mt-2">Clientes entram no painel do studio. Administradores entram no painel completo da plataforma.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
