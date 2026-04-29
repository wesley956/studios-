import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { buildCsv, csvResponse } from '@/lib/export';
import { currencyBRL, formatDateTimeBR, statusLabel } from '@/lib/utils';

export async function GET() {
  const business = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('payments')
    .select('*, customers(full_name), services(name)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(500);

  const csv = buildCsv(
    ['Data', 'Cliente', 'Serviço', 'Status', 'Forma', 'Valor recebido', 'Valor cobrado', 'Observações'],
    (payments || []).map((payment) => [
      formatDateTimeBR(payment.paid_at || payment.created_at),
      (payment.customers as { full_name?: string } | null)?.full_name || 'Cliente',
      (payment.services as { name?: string } | null)?.name || 'Atendimento',
      statusLabel(payment.payment_status),
      statusLabel(payment.payment_method),
      currencyBRL(payment.amount || 0),
      currencyBRL(payment.final_amount || 0),
      payment.notes || ''
    ])
  );

  return csvResponse(`financeiro-${business.slug}.csv`, csv);
}
