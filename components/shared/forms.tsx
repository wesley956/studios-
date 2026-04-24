import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  children,
  hint,
  className
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15',
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15',
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15',
        props.className
      )}
    />
  );
}

export function SubmitButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      {...props}
      className={cn(
        'rounded-2xl bg-primary px-5 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'rounded-2xl border border-border bg-white px-4 py-3 text-sm transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      {children}
    </button>
  );
}
