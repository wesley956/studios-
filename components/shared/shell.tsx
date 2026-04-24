import Link from 'next/link';
import { ReactNode } from 'react';
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
  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px,1fr]">
      <aside
        className={cn(
          'border-r p-6',
          tone === 'admin'
            ? 'border-white/10 bg-dark text-white'
            : 'border-border bg-[#FBF7F3]'
        )}
      >
        <div className="mb-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 md:bg-transparent md:p-0">
          <p
            className={cn(
              'text-xs uppercase tracking-[0.2em]',
              tone === 'admin' ? 'text-white/60' : 'text-muted'
            )}
          >
            Studio+
          </p>
          <h1 className="mt-2 text-2xl font-serif">{title}</h1>
          <p className={cn('mt-2 text-sm', tone === 'admin' ? 'text-white/70' : 'text-muted')}>
            Gestão bonita, rápida e pronta para vender.
          </p>
        </div>

        <nav className="space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-2xl px-4 py-3 transition',
                tone === 'admin'
                  ? 'bg-white/5 hover:bg-white/10'
                  : 'bg-white hover:bg-primary-soft'
              )}
            >
              <p className="text-sm font-medium">{item.label}</p>
              {item.helper && (
                <p className={cn('mt-1 text-xs', tone === 'admin' ? 'text-white/60' : 'text-muted')}>
                  {item.helper}
                </p>
              )}
            </Link>
          ))}
        </nav>

        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className={cn(
              'w-full rounded-2xl px-4 py-3 text-sm transition',
              tone === 'admin'
                ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                : 'border border-border bg-white hover:bg-primary-soft'
            )}
          >
            Sair
          </button>
        </form>
      </aside>

      <main className="p-6 md:p-8">{children}</main>
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
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-3xl font-serif md:text-4xl">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-muted">{description}</p>}
      </div>
      {action}
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
  return (
    <div
      className={cn(
        'rounded-[1.5rem] border p-5 shadow-sm',
        tone === 'default' && 'border-border bg-white',
        tone === 'success' && 'border-emerald-100 bg-emerald-50',
        tone === 'warning' && 'border-amber-100 bg-amber-50',
        tone === 'dark' && 'border-white/10 bg-dark text-white'
      )}
    >
      <p className={cn('text-sm', tone === 'dark' ? 'text-white/70' : 'text-muted')}>{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint && <p className={cn('mt-2 text-xs', tone === 'dark' ? 'text-white/60' : 'text-muted')}>{hint}</p>}
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
    <div className="rounded-[1.5rem] border border-dashed border-border bg-white p-8 text-center shadow-sm">
      <h3 className="text-xl font-serif">{title}</h3>
      <p className="mt-2 text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
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
    <section className={cn('rounded-[1.5rem] border border-border bg-white p-6 shadow-sm', className)}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-2xl font-serif">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
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
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.15em]',
        status === 'neutral' && 'bg-primary-soft text-dark',
        status === 'success' && 'bg-emerald-100 text-emerald-700',
        status === 'warning' && 'bg-amber-100 text-amber-700',
        status === 'danger' && 'bg-red-100 text-red-700',
        status === 'dark' && 'bg-dark text-white'
      )}
    >
      {children}
    </span>
  );
}
