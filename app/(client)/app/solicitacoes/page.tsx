import { approveBookingRequest, cancelBookingRequest } from '@/actions/client-bookings';
import { Field, Input, SubmitButton, DangerButton } from '@/components/shared/forms';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { currencyBRL, formatDateBR, formatTime, statusLabel } from '@/lib/utils';

export default async function SolicitacoesPage() {
  await requireClientOwner();
  const business = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from('booking_requests')
    .select('*, services(name, price, duration_minutes)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  async function handleApproveBookingRequest(formData: FormData): Promise<void> {
    'use server';
    await approveBookingRequest(formData);
  }

  async function handleCancelBookingRequest(formData: FormData): Promise<void> {
    'use server';
    await cancelBookingRequest(formData);
  }

  return (
    <div>
      <TopHeading title="Solicitações" description="Aprove, ajuste data e horário, defina valor final e transforme pedidos públicos em agenda confirmada." />

      <div className="space-y-4">
        {requests?.length ? requests.map((item) => (
          <details key={item.id} className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm open:bg-[#FCFAF7]">
            <summary className="flex cursor-pointer list-none flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium">{item.customer_name}</p>
                  <StatusBadge status={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'}>{statusLabel(item.status)}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {(item.services as { name?: string } | null)?.name || 'Serviço não informado'} • {formatDateBR(item.requested_date)} às {formatTime(item.requested_time)}
                </p>
                <p className="mt-1 text-sm text-muted">{item.customer_phone}</p>
                {item.notes && <p className="mt-2 text-sm text-muted">{item.notes}</p>}
              </div>
              <span className="text-sm text-primary">Abrir ação</span>
            </summary>

            {item.status === 'pending' ? (
              <div className="mt-5 grid gap-4 border-t border-border pt-5 xl:grid-cols-2">
                <form action={handleApproveBookingRequest} className="grid gap-4 rounded-[1.5rem] border border-border bg-white p-5">
                  <input type="hidden" name="requestId" value={item.id} />
                  <h3 className="text-xl font-serif">Aprovar e agendar</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Data confirmada"><Input name="confirmedDate" type="date" defaultValue={item.requested_date} /></Field>
                    <Field label="Horário confirmado"><Input name="confirmedTime" type="time" defaultValue={item.requested_time?.slice(0, 5)} /></Field>
                  </div>
                  <Field label="Valor final"><Input name="finalPrice" type="number" step="0.01" defaultValue={(item.services as { price?: number } | null)?.price || ''} /></Field>
                  <p className="text-xs text-muted">Duração prevista: {(item.services as { duration_minutes?: number } | null)?.duration_minutes || 60} minutos.</p>
                  <SubmitButton>Aprovar solicitação</SubmitButton>
                </form>

                <form action={handleCancelBookingRequest} className="grid gap-4 rounded-[1.5rem] border border-red-100 bg-red-50 p-5">
                  <input type="hidden" name="requestId" value={item.id} />
                  <h3 className="text-xl font-serif">Recusar</h3>
                  <p className="text-sm text-muted">Use quando o horário não puder ser atendido. Depois você pode pedir que a cliente envie uma nova solicitação.</p>
                  <DangerButton type="submit">Recusar solicitação</DangerButton>
                </form>
              </div>
            ) : (
              <div className="mt-5 border-t border-border pt-5 text-sm text-muted">
                {item.status === 'approved'
                  ? `Aprovada para ${formatDateBR(item.approved_date || item.requested_date)} às ${formatTime(item.approved_time || item.requested_time)}.`
                  : 'Solicitação encerrada.'}
              </div>
            )}
          </details>
        )) : <EmptyState title="Nenhuma solicitação recebida" description="Quando uma cliente enviar um pedido pela página pública, ele aparecerá aqui." />}
      </div>
    </div>
  );
}
