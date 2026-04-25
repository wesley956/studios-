import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react';
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
    <div className={cn('grid gap-2', className)}>
      <label className="text-sm font-medium text-text">{label}</label>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text outline-none transition',
        'placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15',
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text outline-none transition',
        'placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15',
        props.className
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text outline-none transition',
        'focus:border-primary focus:ring-2 focus:ring-primary/15',
        props.className
      )}
    />
  );
}

export function SubmitButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="submit"
      {...props}
      className={cn(
        'rounded-2xl bg-primary px-5 py-3 font-medium text-white transition hover:opacity-90',
        'disabled:cursor-not-allowed disabled:opacity-60',
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
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type={props.type || 'button'}
      {...props}
      className={cn(
        'rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text transition hover:bg-primary-soft',
        'disabled:cursor-not-allowed disabled:opacity-60',
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
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type={props.type || 'button'}
      {...props}
      className={cn(
        'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      {children}
    </button>
  );
}
