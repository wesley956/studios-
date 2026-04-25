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
  const badgeLabel = tone === 'admin' ? 'Painel admin' : 'Painel do studio';
  const badgeClass =
    tone === 'admin'
      ? 'border-sky-200 bg-sky-50 text-sky-800'
      : 'border-primary/20 bg-primary-soft text-primary';

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[300px,1fr] lg:px-6 lg:py-6">
        <aside className="rounded-[2rem] border border-border bg-surface p-5 shadow-soft">
          <div className="rounded-[1.75rem] border border-border bg-[var(--theme-surface-alt)] p-5">
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
              Gestão bonita, rápida e pronta para vender.
            </p>
          </div>

          <nav className="mt-5 space-y-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[1.5rem] border border-border bg-surface px-4 py-3 transition hover:bg-primary-soft"
              >
                <p className="font-medium text-text">{item.label}</p>
                {item.helper ? <p className="mt-1 text-xs text-muted">{item.helper}</p> : null}
              </Link>
            ))}
          </nav>

          <form action={signOut} className="mt-5">
            <button
              type="submit"
              className="w-full rounded-[1.5rem] border border-border bg-white px-4 py-3 text-sm font-medium transition hover:bg-primary-soft"
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
    success: 'bg-emerald-50',
    warning: 'bg-amber-50',
    dark: 'bg-[var(--theme-surface-alt)]'
  };

  return (
    <div className={cn('rounded-[1.75rem] border border-border p-5 shadow-soft', toneMap[tone])}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-text">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-muted">{hint}</p> : null}
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
