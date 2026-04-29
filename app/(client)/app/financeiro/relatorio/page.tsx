import Link from 'next/link';
import { PrintButton } from '@/components/shared/print-button';
import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { currencyBRL, formatDateBR, formatDateTimeBR, statusLabel } from '@/lib/utils';

export default async function FinanceiroRelatorioPage() {
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from('payments')
    .select('*, customers(full_name), services(name)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(500);

  const total = (payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <main className="bg-white p-6 text-slate-950 print:p-0">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link href="/app/financeiro" className="rounded-2xl border px-4 py-2 text-sm">Voltar</Link>
          <PrintButton />
        </div>

        <header className="border-b pb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Studio+ Gestão</p>
          <h1 className="mt-2 text-3xl font-semibold">Relatório financeiro</h1>
          <p className="mt-1 text-sm text-slate-600">{business.business_name} • Gerado em {formatDateBR(new Date())}</p>
          <p className="mt-3 text-xl font-semibold">Total recebido: {currencyBRL(total)}</p>
        </header>

        <table className="mt-6 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-100">
              <th className="p-3">Data</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Status</th>
              <th className="p-3">Forma</th>
              <th className="p-3 text-right">Recebido</th>
            </tr>
          </thead>
          <tbody>
            {(payments || []).map((payment) => (
              <tr key={payment.id} className="border-b">
                <td className="p-3">{formatDateTimeBR(payment.paid_at || payment.created_at)}</td>
                <td className="p-3">{(payment.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</td>
                <td className="p-3">{(payment.services as { name?: string } | null)?.name || 'Atendimento'}</td>
                <td className="p-3">{statusLabel(payment.payment_status)}</td>
                <td className="p-3">{statusLabel(payment.payment_method)}</td>
                <td className="p-3 text-right font-medium">{currencyBRL(payment.amount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
