import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-surface p-8 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+ Gestão</p>
        <h1 className="mt-3 text-3xl font-serif">Página não encontrada</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          O link pode estar incorreto, desativado ou o negócio pode não estar mais público.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
