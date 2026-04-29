import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOut } from '@/actions/auth';
import { cn } from '@/lib/utils';

export function SidebarLayout({
  title,
  nav,
  children,
  tone = 'client'
}: {
  title: string;
  nav: { href: string; label: string; helper?: string }[];
  children: ReactNode;
  tone?: 'client' | 'admin';
}) {
  const isAdmin = tone === 'admin';
  const badgeLabel = isAdmin ? 'Painel admin' : 'Painel do studio';
  const badgeClass = isAdmin
    ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
    : 'border-primary/20 bg-primary-soft text-primary';

  return (
    <div className={cn('min-h-screen', isAdmin && 'admin-theme')}>
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[320px,1fr] lg:px-6 lg:py-6">
        <aside className="rounded-[2rem] border border-border bg-surface p-5 shadow-soft">
          <div className={cn('rounded-[1.75rem] border border-border p-5', isAdmin ? 'admin-command-strip' : 'bg-[var(--theme-surface-alt)]')}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Studio+</p>
                <h1 className="mt-2 text-2xl font-serif">{title}</h1>
              </div>

              <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', badgeClass)}>
                {badgeLabel}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted">
              {isAdmin
                ? 'Comando central com contraste alto, atalhos claros e leitura mais objetiva.'
                : 'Gestão bonita, rápida e pronta para vender.'}
            </p>
          </div>

          {isAdmin ? (
            <div className="mt-4 rounded-[1.35rem] border border-border bg-[var(--theme-surface-alt)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mapa rápido</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Use os números do menu para localizar a seção sem precisar reler tudo.
              </p>
            </div>
          ) : null}

          <nav className="mt-5 space-y-2">
            {nav.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-[1.5rem] border border-border bg-surface px-4 py-3 transition hover:bg-primary-soft',
                  isAdmin && 'admin-nav-item'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm font-bold',
                      isAdmin ? 'admin-nav-number' : 'border-primary/20 bg-primary-soft text-primary'
                    )}
                  >
                    {index + 1}
                  </span>

                  <div>
                    <p className="font-semibold text-text">{item.label}</p>
                    {item.helper ? <p className="mt-1 text-xs leading-5 text-muted">{item.helper}</p> : null}
                  </div>
                </div>
              </Link>
            ))}
          </nav>

          <form action={signOut} className="mt-5">
            <button
              type="submit"
              className="w-full rounded-[1.5rem] border border-border bg-surface px-4 py-3 text-sm font-medium text-text transition hover:bg-primary-soft"
            >
              Sair
            </button>
          </form>
        </aside>

        <main className="rounded-[2rem] border border-border bg-surface p-5 shadow-soft lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export function TopHeading({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-3xl font-serif md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{description}</p> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default'
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'dark';
}) {
  const toneMap = {
    default: 'bg-surface',
    success: 'bg-emerald-50 text-slate-950',
    warning: 'bg-amber-50 text-slate-950',
    dark: 'bg-[var(--theme-surface-alt)]'
  };

  return (
    <div className={cn('rounded-[1.75rem] border border-border p-5 shadow-soft', toneMap[tone])}>
      <p className={cn('text-sm', tone === 'default' || tone === 'dark' ? 'text-muted' : 'text-slate-600')}>{label}</p>
      <p className={cn('mt-3 text-3xl font-semibold', tone === 'default' || tone === 'dark' ? 'text-text' : 'text-slate-950')}>
        {value}
      </p>
      {hint ? (
        <p className={cn('mt-2 text-xs leading-5', tone === 'default' || tone === 'dark' ? 'text-muted' : 'text-slate-600')}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-border bg-[var(--theme-surface-alt)] p-8 text-center">
      <h3 className="text-2xl font-serif">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  action,
  className
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[1.85rem] border border-border bg-surface p-6 shadow-soft', className)}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-2xl font-serif">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {children}
    </section>
  );
}

export function StatusBadge({
  status,
  children
}: {
  status: 'neutral' | 'success' | 'warning' | 'danger' | 'dark';
  children: ReactNode;
}) {
  const toneMap = {
    neutral: 'border-border bg-white text-text',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-700',
    dark: 'border-slate-200 bg-slate-100 text-slate-800'
  };

  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', toneMap[status])}>
      {children}
    </span>
  );
}
