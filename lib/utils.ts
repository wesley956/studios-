import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currencyBRL(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function whatsappLink(phone: string, text?: string) {
  const clean = phone.replace(/\D/g, '');
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${clean}${query}`;
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDateBR(value: string | Date | null | undefined) {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTimeBR(value: string | Date | null | undefined) {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '-';
  return value.slice(0, 5);
}

export function dateToISO(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getStartOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getStartOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getEndOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function parseMoney(value: FormDataEntryValue | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value !== 'string') return Number(value || 0);

  const normalized = value
    .trim()
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number(normalized || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sumValues(values: Array<number | string | null | undefined>) {
  return values.reduce((acc, value) => acc + Number(value || 0), 0);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function statusLabel(value: string | null | undefined) {
  const dictionary: Record<string, string> = {
    trial: 'Teste',
    active: 'Ativo',
    blocked: 'Bloqueado',
    pending: 'Pendente',
    approved: 'Aprovado',
    rescheduled: 'Remarcado',
    cancelled: 'Cancelado',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    no_show: 'Faltou',
    paid: 'Pago',
    partial: 'Parcial',
    refunded: 'Estornado',
    pix: 'Pix',
    cash: 'Dinheiro',
    credit_card: 'Cartão de crédito',
    debit_card: 'Cartão de débito',
    transfer: 'Transferência'
  };

  return dictionary[value || ''] || value || '-';
}

export function getInitials(name: string | null | undefined) {
  if (!name) return 'ST';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function compactNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}
