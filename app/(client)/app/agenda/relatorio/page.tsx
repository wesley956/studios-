import Link from 'next/link';
import { PrintButton } from '@/components/shared/print-button';
import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { currencyBRL, formatDateBR, formatTime, statusLabel } from '@/lib/utils';

export default async function AgendaRelatorioPage() {
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, customers(full_name, phone), services(name)')
    .eq('business_id', business.id)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(500);

  return (
    <main className="bg-white p-6 text-slate-950 print:p-0">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link href="/app/agenda" className="rounded-2xl border px-4 py-2 text-sm">Voltar</Link>
          <PrintButton />
        </div>

        <header className="border-b pb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Studio+ Gestão</p>
          <h1 className="mt-2 text-3xl font-semibold">Relatório da agenda</h1>
          <p className="mt-1 text-sm text-slate-600">{business.business_name} • Gerado em {formatDateBR(new Date())}</p>
        </header>

        <table className="mt-6 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-100">
              <th className="p-3">Data</th>
              <th className="p-3">Horário</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(appointments || []).map((appointment) => (
              <tr key={appointment.id} className="border-b">
                <td className="p-3">{formatDateBR(appointment.appointment_date)}</td>
                <td className="p-3">{formatTime(appointment.appointment_time)}</td>
                <td className="p-3">{(appointment.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</td>
                <td className="p-3">{(appointment.services as { name?: string } | null)?.name || 'Serviço'}</td>
                <td className="p-3">{statusLabel(appointment.status)}</td>
                <td className="p-3 text-right font-medium">{currencyBRL(appointment.final_price || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
