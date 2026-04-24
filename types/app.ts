export type Role = 'admin' | 'client_owner';
export type BusinessStatus = 'trial' | 'active' | 'blocked';
export type BookingRequestStatus = 'pending' | 'approved' | 'rescheduled' | 'cancelled';
export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
export type PaymentMethod = 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'transfer';

export type BusinessHour = {
  id: string;
  business_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};
