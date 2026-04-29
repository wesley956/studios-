import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { buildCsv, csvResponse } from '@/lib/export';
import { currencyBRL, formatDateBR, formatTime, statusLabel } from '@/lib/utils';

export async function GET() {
  const business = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, customers(full_name, phone), services(name)')
    .eq('business_id', business.id)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(500);

  const csv = buildCsv(
    ['Data', 'Horário', 'Cliente', 'Telefone', 'Serviço', 'Status', 'Valor', 'Pagamento', 'Observações'],
    (appointments || []).map((appointment) => [
      formatDateBR(appointment.appointment_date),
      formatTime(appointment.appointment_time),
      (appointment.customers as { full_name?: string } | null)?.full_name || 'Cliente',
      (appointment.customers as { phone?: string } | null)?.phone || '',
      (appointment.services as { name?: string } | null)?.name || 'Serviço',
      statusLabel(appointment.status),
      currencyBRL(appointment.final_price || 0),
      statusLabel(appointment.payment_status),
      appointment.notes || ''
    ])
  );

  return csvResponse(`agenda-${business.slug}.csv`, csv);
}
