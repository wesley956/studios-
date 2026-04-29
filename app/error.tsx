'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-surface p-8 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+ Gestão</p>
        <h1 className="mt-3 text-3xl font-serif">Algo não saiu como esperado</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          A página encontrou um erro inesperado. Você pode tentar novamente ou voltar para o painel. Se continuar, envie o código abaixo para o suporte.
        </p>

        {error.digest ? (
          <div className="mt-5 rounded-2xl border border-border bg-[var(--theme-surface-alt)] p-4 text-sm">
            Código do erro: <strong>{error.digest}</strong>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white">
            Tentar novamente
          </button>
          <Link href="/app" className="rounded-2xl border border-border bg-white px-5 py-3 text-sm font-medium">
            Voltar para o painel
          </Link>
        </div>
      </div>
    </main>
  );
}
