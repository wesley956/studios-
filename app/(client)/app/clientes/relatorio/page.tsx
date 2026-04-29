import Link from 'next/link';
import { PrintButton } from '@/components/shared/print-button';
import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateBR, statusLabel } from '@/lib/utils';

export default async function ClientesRelatorioPage() {
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id)
    .order('full_name', { ascending: true });

  return (
    <main className="bg-white p-6 text-slate-950 print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link href="/app/clientes" className="rounded-2xl border px-4 py-2 text-sm">Voltar</Link>
          <PrintButton />
        </div>

        <header className="border-b pb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Studio+ Gestão</p>
          <h1 className="mt-2 text-3xl font-semibold">Relatório de clientes</h1>
          <p className="mt-1 text-sm text-slate-600">{business.business_name} • Gerado em {formatDateBR(new Date())}</p>
        </header>

        <table className="mt-6 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-100">
              <th className="p-3">Nome</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Aniversário</th>
              <th className="p-3">Próximo retorno</th>
              <th className="p-3">Tags</th>
            </tr>
          </thead>
          <tbody>
            {(customers || []).map((customer) => (
              <tr key={customer.id} className="border-b">
                <td className="p-3 font-medium">{customer.full_name}</td>
                <td className="p-3">{customer.phone}</td>
                <td className="p-3">{customer.birthday ? formatDateBR(customer.birthday) : '-'}</td>
                <td className="p-3">{customer.next_follow_up_date ? formatDateBR(customer.next_follow_up_date) : '-'}</td>
                <td className="p-3">{Array.isArray(customer.tags) ? customer.tags.map(statusLabel).join(', ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
