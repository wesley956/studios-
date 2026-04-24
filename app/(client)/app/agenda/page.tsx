import { updateAppointmentStatus } from '@/actions/client-bookings';
import { DangerButton, Field, Input, Select, SubmitButton } from '@/components/shared/forms';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { currencyBRL, formatDateBR, formatTime, statusLabel } from '@/lib/utils';

const statusOptions = ['confirmed', 'completed', 'cancelled', 'no_show'];

export default async function AgendaPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; date?: string }>;
}) {
  await requireClientOwner();
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const selectedStatus = params?.status || '';
  const selectedDate = params?.date || '';

  let query = supabase
    .from('appointments')
    .select('*, customers(full_name), services(name, price, duration_minutes)')
    .eq('business_id', business.id)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (selectedStatus) query = query.eq('status', selectedStatus);
  if (selectedDate) query = query.eq('appointment_date', selectedDate);

  const { data: appointments } = await query;

  async function handleUpdateAppointmentStatus(formData: FormData): Promise<void> {
    'use server';
    await updateAppointmentStatus(formData);
  }

  return (
    <div>
      <TopHeading title="Agenda" description="Controle horários, evite conflitos, remarque quando precisar e conclua com pagamento registrado." />

      <SectionCard title="Filtros da agenda" description="Use filtros para acompanhar o dia, o mês ou apenas um status específico." className="mb-6">
        <form className="grid gap-4 md:grid-cols-[1fr,220px,180px,160px]">
          <Field label="Data"><Input name="date" type="date" defaultValue={selectedDate} /></Field>
          <Field label="Status">
            <Select name="status" defaultValue={selectedStatus}>
              <option value="">Todos</option>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </Select>
          </Field>
          <div className="md:self-end">
            <SubmitButton className="w-full">Filtrar</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Atendimentos" description="Cada item permite remarcar, concluir com pagamento ou cancelar com motivo.">
        <div className="space-y-4">
          {appointments?.length ? appointments.map((item) => (
            <details key={item.id} className="group rounded-[1.5rem] border border-border p-5 open:bg-[#FCFAF7]">
              <summary className="flex cursor-pointer list-none flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium">{(item.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</p>
                    <StatusBadge
                      status={item.status === 'completed' ? 'success' : item.status === 'cancelled' || item.status === 'no_show' ? 'danger' : 'neutral'}
                    >
                      {statusLabel(item.status)}
                    </StatusBadge>
                    <span className="rounded-full bg-[#FBF7F3] px-3 py-1 text-xs uppercase text-muted">
                      {formatDateBR(item.appointment_date)} • {formatTime(item.appointment_time)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {(item.services as { name?: string } | null)?.name || 'Serviço'} • {item.duration_minutes || (item.services as { duration_minutes?: number } | null)?.duration_minutes || 60} min
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Valor final: {currencyBRL(item.final_price)} • Recebido: {currencyBRL(item.paid_amount)}
                  </p>
                  {item.notes && <p className="mt-2 text-sm text-muted">{item.notes}</p>}
                </div>
                <span className="text-sm text-primary group-open:hidden">Gerenciar</span>
              </summary>

              <form action={handleUpdateAppointmentStatus} className="mt-5 grid gap-4 border-t border-border pt-5">
                <input type="hidden" name="appointmentId" value={item.id} />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Status">
                    <Select name="status" defaultValue={item.status}>
                      {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                    </Select>
                  </Field>
                  <Field label="Data"><Input name="appointmentDate" type="date" defaultValue={item.appointment_date} /></Field>
                  <Field label="Horário"><Input name="appointmentTime" type="time" defaultValue={item.appointment_time?.slice(0, 5)} /></Field>
                  <Field label="Valor final"><Input name="finalPrice" type="number" step="0.01" defaultValue={item.final_price} /></Field>
                  <Field label="Valor recebido"><Input name="paidAmount" type="number" step="0.01" defaultValue={item.paid_amount} /></Field>
                  <Field label="Forma de pagamento">
                    <Select name="paymentMethod" defaultValue={item.payment_method || 'pix'}>
                      <option value="pix">Pix</option>
                      <option value="cash">Dinheiro</option>
                      <option value="credit_card">Cartão de crédito</option>
                      <option value="debit_card">Cartão de débito</option>
                      <option value="transfer">Transferência</option>
                    </Select>
                  </Field>
                  <Field label="Observações" className="xl:col-span-2"><Input name="notes" defaultValue={item.notes || ''} /></Field>
                  <Field label="Motivo do cancelamento/falta" className="xl:col-span-2"><Input name="cancellationReason" defaultValue={item.cancellation_reason || ''} /></Field>
                </div>
                <div className="flex flex-wrap gap-3">
                  <SubmitButton>Salvar atualização</SubmitButton>
                </div>
              </form>
            </details>
          )) : <EmptyState title="Nenhum agendamento encontrado" description="Assim que você aprovar solicitações, os horários confirmados aparecerão aqui." />}
        </div>
      </SectionCard>
    </div>
  );
}
