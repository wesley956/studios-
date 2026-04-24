import type { BusinessHour } from '@/types/app';
import { addDays, dateToISO, formatTime } from '@/lib/utils';

export type AppointmentSlot = {
  appointment_date: string;
  appointment_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
};

export const DEFAULT_BUSINESS_HOURS: Omit<BusinessHour, 'id' | 'business_id'>[] = [
  { day_of_week: 0, is_open: false, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 1, is_open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 2, is_open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 3, is_open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 4, is_open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 5, is_open: true, open_time: '09:00', close_time: '18:00' },
  { day_of_week: 6, is_open: true, open_time: '09:00', close_time: '15:00' }
];

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function calculateEndTime(startTime: string, durationMinutes: number) {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

export function normalizeBusinessHours(hours: Partial<BusinessHour>[] | null | undefined) {
  const source = hours && hours.length ? hours : DEFAULT_BUSINESS_HOURS;
  const mapped = source.map((hour) => ({
    day_of_week: Number(hour.day_of_week ?? 0),
    is_open: Boolean(hour.is_open),
    open_time: formatTime(hour.open_time || '09:00') || '09:00',
    close_time: formatTime(hour.close_time || '18:00') || '18:00'
  }));

  return [...mapped].sort((a, b) => a.day_of_week - b.day_of_week);
}

export function getBusinessHourForDate(hours: Partial<BusinessHour>[] | null | undefined, isoDate: string) {
  const list = normalizeBusinessHours(hours);
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  return list.find((item) => item.day_of_week === day) || list[0];
}

export function isWithinBusinessHours({
  date,
  time,
  durationMinutes,
  hours
}: {
  date: string;
  time: string;
  durationMinutes: number;
  hours: Partial<BusinessHour>[] | null | undefined;
}) {
  const businessHour = getBusinessHourForDate(hours, date);
  if (!businessHour?.is_open) return false;

  const start = timeToMinutes(time);
  const end = start + durationMinutes;
  const open = timeToMinutes(businessHour.open_time);
  const close = timeToMinutes(businessHour.close_time);

  return start >= open && end <= close;
}

export function appointmentsOverlap({
  date,
  startTime,
  endTime,
  appointments,
  ignoreAppointmentId
}: {
  date: string;
  startTime: string;
  endTime: string;
  appointments: AppointmentSlot[];
  ignoreAppointmentId?: string;
}) {
  const targetStart = timeToMinutes(startTime);
  const targetEnd = timeToMinutes(endTime);

  return appointments.some((appointment: AppointmentSlot & { id?: string }) => {
    if ((appointment as { id?: string }).id && (appointment as { id?: string }).id === ignoreAppointmentId) {
      return false;
    }

    if (appointment.appointment_date !== date) return false;
    if (!appointment.status || appointment.status === 'cancelled' || appointment.status === 'no_show') return false;

    const appointmentStart = timeToMinutes(appointment.appointment_time);
    const appointmentEnd = appointment.end_time
      ? timeToMinutes(appointment.end_time)
      : appointment.duration_minutes
        ? appointmentStart + Number(appointment.duration_minutes)
        : appointmentStart + 60;

    return targetStart < appointmentEnd && targetEnd > appointmentStart;
  });
}

export function generateAvailableSlots({
  date,
  durationMinutes,
  slotIntervalMinutes,
  hours,
  appointments,
  minimumStartTime
}: {
  date: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  hours: Partial<BusinessHour>[] | null | undefined;
  appointments: AppointmentSlot[];
  minimumStartTime?: string;
}) {
  const businessHour = getBusinessHourForDate(hours, date);
  if (!businessHour?.is_open) return [];

  const open = Math.max(timeToMinutes(businessHour.open_time), minimumStartTime ? timeToMinutes(minimumStartTime) : 0);
  const close = timeToMinutes(businessHour.close_time);
  const slots: string[] = [];

  for (let cursor = open; cursor + durationMinutes <= close; cursor += slotIntervalMinutes) {
    const startTime = minutesToTime(cursor);
    const endTime = minutesToTime(cursor + durationMinutes);

    const hasConflict = appointmentsOverlap({
      date,
      startTime,
      endTime,
      appointments
    });

    if (!hasConflict) slots.push(startTime);
  }

  return slots;
}

export function buildBookingCalendar({
  days = 21,
  durationMinutes,
  slotIntervalMinutes,
  hours,
  appointments,
  startDate = new Date(),
  leadTimeHours = 0
}: {
  days?: number;
  durationMinutes: number;
  slotIntervalMinutes: number;
  hours: Partial<BusinessHour>[] | null | undefined;
  appointments: AppointmentSlot[];
  startDate?: Date;
  leadTimeHours?: number;
}) {
  const now = startDate;
  const minimumLeadDate = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000);

  return Array.from({ length: days }, (_, index) => {
    const date = dateToISO(addDays(startDate, index));
    const sameDay = date === dateToISO(minimumLeadDate);
    return {
      date,
      slots: generateAvailableSlots({
        date,
        durationMinutes,
        slotIntervalMinutes,
        hours,
        appointments,
        minimumStartTime: sameDay ? minimumLeadDate.toTimeString().slice(0, 5) : undefined
      })
    };
  }).filter((item) => item.slots.length > 0);
}

