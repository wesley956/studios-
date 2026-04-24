'use client';

import { useEffect, useMemo, useState } from 'react';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';

type ServiceOption = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
};

type CalendarMap = Record<string, Array<{ date: string; slots: string[] }>>;

export default function BookingForm({
  businessId,
  returnTo,
  services,
  calendars,
  action
}: {
  businessId: string;
  returnTo: string;
  services: ServiceOption[];
  calendars: CalendarMap;
  action: (formData: FormData) => void;
}) {
  const defaultService = services[0]?.id || '';
  const [serviceId, setServiceId] = useState(defaultService);

  const activeCalendar = useMemo(() => calendars[serviceId] || [], [calendars, serviceId]);
  const [requestedDate, setRequestedDate] = useState(activeCalendar[0]?.date || '');
  const availableSlots = useMemo(() => activeCalendar.find((item) => item.date === requestedDate)?.slots || [], [activeCalendar, requestedDate]);
  const [requestedTime, setRequestedTime] = useState(availableSlots[0] || '');

  useEffect(() => {
    const nextDate = activeCalendar[0]?.date || '';
    setRequestedDate(nextDate);
  }, [serviceId, activeCalendar]);

  useEffect(() => {
    const nextTime = availableSlots[0] || '';
    setRequestedTime(nextTime);
  }, [requestedDate, availableSlots]);

  return (
    <form action={action} className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="grid gap-5">
        <Field label="Serviço">
          <Select name="serviceId" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} • {service.duration_minutes} min
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Data disponível">
            <Select name="requestedDate" value={requestedDate} onChange={(event) => setRequestedDate(event.target.value)}>
              {activeCalendar.length ? activeCalendar.map((item) => (
                <option key={item.date} value={item.date}>{new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR')}</option>
              )) : <option value="">Sem datas disponíveis</option>}
            </Select>
          </Field>
          <Field label="Horário disponível">
            <Select name="requestedTime" value={requestedTime} onChange={(event) => setRequestedTime(event.target.value)}>
              {availableSlots.length ? availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>) : <option value="">Sem horários</option>}
            </Select>
          </Field>
        </div>

        <Field label="Seu nome"><Input name="customerName" type="text" required /></Field>
        <Field label="WhatsApp"><Input name="customerPhone" type="text" required /></Field>
        <Field label="Observações"><Textarea name="notes" rows={4} /></Field>
        <SubmitButton disabled={!serviceId || !requestedDate || !requestedTime}>Solicitar agendamento</SubmitButton>
      </div>
    </form>
  );
}
