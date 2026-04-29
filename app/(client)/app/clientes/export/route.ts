import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { buildCsv, csvResponse } from '@/lib/export';
import { formatDateBR } from '@/lib/utils';

export async function GET() {
  const business = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id)
    .order('full_name', { ascending: true });

  const csv = buildCsv(
    ['Nome', 'Telefone', 'Aniversário', 'Próximo retorno', 'Tags', 'Preferências', 'Cuidados', 'Observações'],
    (customers || []).map((customer) => [
      customer.full_name,
      customer.phone,
      customer.birthday ? formatDateBR(customer.birthday) : '',
      customer.next_follow_up_date ? formatDateBR(customer.next_follow_up_date) : '',
      Array.isArray(customer.tags) ? customer.tags.join(' | ') : '',
      customer.preferences || '',
      customer.restrictions || '',
      customer.notes || ''
    ])
  );

  return csvResponse(`clientes-${business.slug}.csv`, csv);
}
