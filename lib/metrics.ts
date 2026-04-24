import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getEndOfDay, getEndOfMonth, getStartOfDay, getStartOfMonth } from '@/lib/utils';

function toIsoDateTime(date: Date) {
  return date.toISOString();
}

export async function getClientDashboardMetrics() {
  const business = await getCurrentBusiness();
  const supabase = await createClient();
  const monthStart = toIsoDateTime(getStartOfMonth());
  const monthEnd = toIsoDateTime(getEndOfMonth());
  const dayStart = toIsoDateTime(getStartOfDay());
  const dayEnd = toIsoDateTime(getEndOfDay());

  const [
    { count: pendingRequests },
    { count: servicesCount },
    { count: customersCount },
    { count: appointmentsCount },
    { data: todayPayments },
    { data: monthPayments },
    { data: completedMonthAppointments },
    { data: serviceUsage },
    { data: latestPayments },
    { data: upcomingAppointments }
  ] = await Promise.all([
    supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'pending'),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    supabase.from('payments').select('final_amount').eq('business_id', business.id).eq('payment_status', 'paid').gte('paid_at', dayStart).lte('paid_at', dayEnd),
    supabase.from('payments').select('final_amount').eq('business_id', business.id).eq('payment_status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
    supabase.from('appointments').select('id, final_price').eq('business_id', business.id).eq('status', 'completed').gte('completed_at', monthStart).lte('completed_at', monthEnd),
    supabase.from('appointments').select('service_id, services(name)').eq('business_id', business.id).eq('status', 'completed').gte('completed_at', monthStart).lte('completed_at', monthEnd),
    supabase.from('payments').select('id, final_amount, payment_method, paid_at, customers(full_name), services(name)').eq('business_id', business.id).order('paid_at', { ascending: false }).limit(5),
    supabase.from('appointments').select('id, appointment_date, appointment_time, status, customers(full_name), services(name), final_price').eq('business_id', business.id).in('status', ['confirmed', 'completed']).order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true }).limit(6)
  ]);

  const receivedToday = (todayPayments || []).reduce((sum, item) => sum + Number(item.final_amount || 0), 0);
  const receivedMonth = (monthPayments || []).reduce((sum, item) => sum + Number(item.final_amount || 0), 0);
  const completedMonth = completedMonthAppointments || [];
  const ticketAverage = completedMonth.length
    ? completedMonth.reduce((sum, item) => sum + Number(item.final_price || 0), 0) / completedMonth.length
    : 0;

  const serviceMap = new Map<string, { name: string; count: number }>();
  (serviceUsage || []).forEach((item) => {
    const key = item.service_id || 'unknown';
    const current = serviceMap.get(key) || { name: (item.services as { name?: string } | null)?.name || 'Sem serviço', count: 0 };
    current.count += 1;
    serviceMap.set(key, current);
  });

  const topService = [...serviceMap.values()].sort((a, b) => b.count - a.count)[0] || null;

  return {
    business,
    summary: {
      pendingRequests: pendingRequests || 0,
      servicesCount: servicesCount || 0,
      customersCount: customersCount || 0,
      appointmentsCount: appointmentsCount || 0,
      receivedToday,
      receivedMonth,
      ticketAverage,
      completedMonthCount: completedMonth.length,
      topService: topService?.name || 'Sem dados',
      topServiceCount: topService?.count || 0
    },
    latestPayments: latestPayments || [],
    upcomingAppointments: upcomingAppointments || []
  };
}

export async function getAdminDashboardMetrics() {
  const supabase = await createClient();
  const monthStart = toIsoDateTime(getStartOfMonth());
  const monthEnd = toIsoDateTime(getEndOfMonth());
  const dayStart = toIsoDateTime(getStartOfDay());
  const dayEnd = toIsoDateTime(getEndOfDay());

  const [
    { count: businessesCount },
    { count: trialCount },
    { count: activeCount },
    { count: blockedCount },
    { count: ownersCount },
    { data: monthPayments },
    { data: dayPayments },
    { data: latestBusinesses },
    { data: businesses },
    { data: paymentsByBusiness }
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client_owner'),
    supabase.from('payments').select('final_amount').eq('payment_status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
    supabase.from('payments').select('final_amount').eq('payment_status', 'paid').gte('paid_at', dayStart).lte('paid_at', dayEnd),
    supabase.from('businesses').select('id, business_name, slug, city, status, plan_name, created_at').order('created_at', { ascending: false }).limit(6),
    supabase.from('businesses').select('id, business_name, status, plan_name, created_at, profiles:owner_id(full_name,email)').limit(100),
    supabase.from('payments').select('business_id, final_amount').eq('payment_status', 'paid')
  ]);

  const monthlyRevenue = (monthPayments || []).reduce((sum, item) => sum + Number(item.final_amount || 0), 0);
  const dailyRevenue = (dayPayments || []).reduce((sum, item) => sum + Number(item.final_amount || 0), 0);
  const revenueMap = new Map<string, number>();
  (paymentsByBusiness || []).forEach((item) => {
    revenueMap.set(item.business_id, (revenueMap.get(item.business_id) || 0) + Number(item.final_amount || 0));
  });

  const topBusinesses = (businesses || [])
    .map((item) => ({
      id: item.id,
      business_name: item.business_name,
      status: item.status,
      plan_name: item.plan_name,
      owner: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      revenue: revenueMap.get(item.id) || 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const inactiveBusinesses = [...topBusinesses].sort((a, b) => a.revenue - b.revenue).slice(0, 5);

  return {
    summary: {
      businessesCount: businessesCount || 0,
      trialCount: trialCount || 0,
      activeCount: activeCount || 0,
      blockedCount: blockedCount || 0,
      ownersCount: ownersCount || 0,
      monthlyRevenue,
      dailyRevenue
    },
    latestBusinesses: latestBusinesses || [],
    inactiveBusinesses,
    topBusinesses
  };
}
