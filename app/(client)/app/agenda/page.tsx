import { updateAppointmentStatus } from '@/actions/client-bookings';
import { Field, Input, SecondaryButton, Select, SubmitButton } from '@/components/shared/forms';
import { EmptyState, SectionCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentBusiness, requireClientOwner } from '@/lib/auth';
import { currencyBRL, formatDateBR, formatTime, statusLabel } from '@/lib/utils';

const statusOptions = ['confirmed', 'completed', 'cancelled', 'no_show'] as const;

function getBadgeTone(status: string) {
  if (status === 'completed') return 'success';
  if (status === 'cancelled' || status === 'no_show') return 'danger';
  if (status === 'confirmed') return 'warning';
  return 'neutral';
}

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
      <TopHeading
        title="Agenda"
        description="Gerencie horários, conclua atendimentos com pagamento em 1 clique e acompanhe o que ainda está pendente."
      />

      <SectionCard title="Filtros" description="Refine a agenda por status ou data específica.">
        <form className="grid gap-4 md:grid-cols-[220px,220px,auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Select name="status" defaultValue={selectedStatus}>
              <option value="">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Data</label>
            <Input type="date" name="date" defaultValue={selectedDate} />
          </div>

          <div>
            <SubmitButton>Filtrar</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        className="mt-6"
        title="Atendimentos"
        description="Use as ações rápidas para concluir e registrar pagamento sem abrir o formulário completo."
      >
        <div className="space-y-4">
          {appointments?.length ? (
            appointments.map((item) => {
              const service = item.services as { name?: string; price?: number; duration_minutes?: number } | null;
              const customer = item.customers as { full_name?: string } | null;
              const finalPrice = Number(item.final_price || service?.price || 0);
              const paidAmount = Number(item.paid_amount || 0);

              return (
                <details key={item.id} className="group rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-medium">{customer?.full_name || 'Cliente'}</p>
                        <StatusBadge status={getBadgeTone(item.status)}>{statusLabel(item.status)}</StatusBadge>
                        {item.payment_status && item.payment_status !== 'pending' ? (
                          <StatusBadge
                            status={item.payment_status === 'paid' ? 'success' : item.payment_status === 'partial' ? 'warning' : 'danger'}
                          >
                            {statusLabel(item.payment_status)}
                          </StatusBadge>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-muted">
                        {formatDateBR(item.appointment_date)} • {formatTime(item.appointment_time)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {service?.name || 'Serviço'} • {item.duration_minutes || service?.duration_minutes || 60} min
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Valor final: {currencyBRL(finalPrice)} • Recebido: {currencyBRL(paidAmount)}
                      </p>
                      {item.notes ? <p className="mt-2 text-sm text-muted">{item.notes}</p> : null}
                    </div>

                    <span className="text-sm text-primary group-open:hidden">Gerenciar</span>
                  </summary>

                  <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
                    <p className="font-medium text-emerald-900">Ações rápidas</p>
                    <p className="mt-1 text-sm text-emerald-800/80">
                      Conclua e registre o pagamento sem precisar preencher o formulário inteiro.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <form action={handleUpdateAppointmentStatus}>
                        <input type="hidden" name="appointmentId" value={item.id} />
                        <input type="hidden" name="status" value="completed" />
                        <input type="hidden" name="appointmentDate" value={item.appointment_date} />
                        <input type="hidden" name="appointmentTime" value={item.appointment_time?.slice(0, 5) || ''} />
                        <input type="hidden" name="finalPrice" value={String(finalPrice)} />
                        <input type="hidden" name="paidAmount" value={String(finalPrice)} />
                        <input type="hidden" name="paymentMethod" value="pix" />
                        <SubmitButton className="w-full">Concluir e receber no Pix</SubmitButton>
                      </form>

                      <form action={handleUpdateAppointmentStatus}>
                        <input type="hidden" name="appointmentId" value={item.id} />
                        <input type="hidden" name="status" value="completed" />
                        <input type="hidden" name="appointmentDate" value={item.appointment_date} />
                        <input type="hidden" name="appointmentTime" value={item.appointment_time?.slice(0, 5) || ''} />
                        <input type="hidden" name="finalPrice" value={String(finalPrice)} />
                        <input type="hidden" name="paidAmount" value={String(finalPrice)} />
                        <input type="hidden" name="paymentMethod" value="cash" />
                        <SubmitButton className="w-full">Concluir e receber em dinheiro</SubmitButton>
                      </form>

                      <form action={handleUpdateAppointmentStatus}>
                        <input type="hidden" name="appointmentId" value={item.id} />
                        <input type="hidden" name="status" value="completed" />
                        <input type="hidden" name="appointmentDate" value={item.appointment_date} />
                        <input type="hidden" name="appointmentTime" value={item.appointment_time?.slice(0, 5) || ''} />
                        <input type="hidden" name="finalPrice" value={String(finalPrice)} />
                        <input type="hidden" name="paidAmount" value={String(finalPrice)} />
                        <input type="hidden" name="paymentMethod" value="credit_card" />
                        <SubmitButton className="w-full">Concluir e receber no crédito</SubmitButton>
                      </form>

                      <form action={handleUpdateAppointmentStatus}>
                        <input type="hidden" name="appointmentId" value={item.id} />
                        <input type="hidden" name="status" value="completed" />
                        <input type="hidden" name="appointmentDate" value={item.appointment_date} />
                        <input type="hidden" name="appointmentTime" value={item.appointment_time?.slice(0, 5) || ''} />
                        <input type="hidden" name="finalPrice" value={String(finalPrice)} />
                        <input type="hidden" name="paidAmount" value="0" />
                        <SecondaryButton className="w-full">Concluir e deixar pendente</SecondaryButton>
                      </form>
                    </div>
                  </div>

                  <form action={handleUpdateAppointmentStatus} className="mt-5">
                    <input type="hidden" name="appointmentId" value={item.id} />

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Field label="Status">
                        <Select name="status" defaultValue={item.status}>
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Data do atendimento">
                        <Input name="appointmentDate" type="date" defaultValue={item.appointment_date} />
                      </Field>

                      <Field label="Hora do atendimento">
                        <Input name="appointmentTime" type="time" defaultValue={item.appointment_time?.slice(0, 5) || ''} />
                      </Field>

                      <Field label="Valor final">
                        <Input name="finalPrice" defaultValue={String(finalPrice)} />
                      </Field>

                      <Field label="Valor recebido">
                        <Input name="paidAmount" defaultValue={String(paidAmount)} />
                      </Field>

                      <Field label="Forma de pagamento">
                        <Select name="paymentMethod" defaultValue={item.payment_method || ''}>
                          <option value="">Escolher</option>
                          <option value="pix">Pix</option>
                          <option value="cash">Dinheiro</option>
                          <option value="credit_card">Cartão de crédito</option>
                          <option value="debit_card">Cartão de débito</option>
                          <option value="transfer">Transferência</option>
                        </Select>
                      </Field>

                      <Field label="Observações" className="xl:col-span-2">
                        <Input name="notes" defaultValue={item.notes || ''} />
                      </Field>

                      <Field label="Motivo do cancelamento/falta" className="xl:col-span-2">
                        <Input name="cancellationReason" defaultValue={item.cancellation_reason || ''} />
                      </Field>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <SubmitButton>Salvar atualização</SubmitButton>
                    </div>
                  </form>
                </details>
              );
            })
          ) : (
            <EmptyState
              title="Nenhum agendamento encontrado"
              description="Assim que você aprovar solicitações, os horários confirmados aparecerão aqui."
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
