import { getCurrentBusiness } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getEndOfDay, getEndOfMonth, getStartOfDay, getStartOfMonth } from '@/lib/utils';
import { SINGLE_PLAN_PRICE } from '@/lib/validations/business';

function toIsoDateTime(date: Date) {
  return date.toISOString();
}

type BusinessRelationOwner = { full_name?: string | null; email?: string | null } | null;

type AdminBusinessBase = {
  id: string;
  business_name: string;
  slug: string;
  city: string | null;
  status: string;
  created_at?: string | null;
  profiles?: BusinessRelationOwner[] | BusinessRelationOwner;
};

function unwrapOwner(profiles: AdminBusinessBase['profiles']) {
  return Array.isArray(profiles) ? profiles[0] || null : profiles || null;
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
    supabase
      .from('payments')
      .select('amount')
      .eq('business_id', business.id)
      .in('payment_status', ['paid', 'partial'])
      .gt('amount', 0)
      .gte('paid_at', dayStart)
      .lte('paid_at', dayEnd),
    supabase
      .from('payments')
      .select('amount')
      .eq('business_id', business.id)
      .in('payment_status', ['paid', 'partial'])
      .gt('amount', 0)
      .gte('paid_at', monthStart)
      .lte('paid_at', monthEnd),
    supabase
      .from('appointments')
      .select('id, final_price')
      .eq('business_id', business.id)
      .eq('status', 'completed')
      .gte('completed_at', monthStart)
      .lte('completed_at', monthEnd),
    supabase
      .from('appointments')
      .select('service_id, services(name)')
      .eq('business_id', business.id)
      .eq('status', 'completed')
      .gte('completed_at', monthStart)
      .lte('completed_at', monthEnd),
    supabase
      .from('payments')
      .select('id, amount, final_amount, payment_method, payment_status, paid_at, customers(full_name), services(name)')
      .eq('business_id', business.id)
      .gt('amount', 0)
      .order('paid_at', { ascending: false })
      .limit(5),
    supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, customers(full_name), services(name), final_price')
      .eq('business_id', business.id)
      .in('status', ['confirmed', 'completed'])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(6)
  ]);

  const receivedToday = (todayPayments || []).reduce<number>((sum, item) => sum + Number(item.amount || 0), 0);
  const receivedMonth = (monthPayments || []).reduce<number>((sum, item) => sum + Number(item.amount || 0), 0);

  const completedMonth = completedMonthAppointments || [];
  const ticketAverage = completedMonth.length
    ? completedMonth.reduce<number>((sum, item) => sum + Number(item.final_price || 0), 0) / completedMonth.length
    : 0;

  const serviceMap = new Map<string, { name: string; count: number }>();
  (serviceUsage || []).forEach((item) => {
    const key = item.service_id || 'unknown';
    const current = serviceMap.get(key) || {
      name: (item.services as { name?: string } | null)?.name || 'Sem serviço',
      count: 0
    };
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

  const [
    { count: businessesCount },
    { count: trialCount },
    { count: activeCount },
    { count: blockedCount },
    { count: ownersCount },
    { data: latestBusinessesRaw },
    { data: businessesRaw },
    { data: services },
    { data: customers },
    { data: requests },
    { data: appointments }
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client_owner'),
    supabase
      .from('businesses')
      .select('id, business_name, slug, city, status, created_at, profiles:owner_id(full_name,email)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('businesses')
      .select('id, business_name, slug, city, status, created_at, profiles:owner_id(full_name,email)')
      .limit(200),
    supabase.from('services').select('business_id'),
    supabase.from('customers').select('business_id'),
    supabase.from('booking_requests').select('business_id, status'),
    supabase.from('appointments').select('business_id, status')
  ]);

  const serviceMap = new Map<string, number>();
  const customerMap = new Map<string, number>();
  const requestMap = new Map<string, number>();
  const pendingRequestMap = new Map<string, number>();
  const appointmentMap = new Map<string, number>();
  const completedAppointmentMap = new Map<string, number>();

  (services || []).forEach((item) => {
    serviceMap.set(item.business_id, (serviceMap.get(item.business_id) || 0) + 1);
  });

  (customers || []).forEach((item) => {
    customerMap.set(item.business_id, (customerMap.get(item.business_id) || 0) + 1);
  });

  (requests || []).forEach((item) => {
    requestMap.set(item.business_id, (requestMap.get(item.business_id) || 0) + 1);
    if (item.status === 'pending') {
      pendingRequestMap.set(item.business_id, (pendingRequestMap.get(item.business_id) || 0) + 1);
    }
  });

  (appointments || []).forEach((item) => {
    appointmentMap.set(item.business_id, (appointmentMap.get(item.business_id) || 0) + 1);
    if (item.status === 'completed') {
      completedAppointmentMap.set(item.business_id, (completedAppointmentMap.get(item.business_id) || 0) + 1);
    }
  });

  const businesses = ((businessesRaw || []) as unknown as AdminBusinessBase[]).map((item) => {
    const servicesCount = serviceMap.get(item.id) || 0;
    const customersCount = customerMap.get(item.id) || 0;
    const requestsCount = requestMap.get(item.id) || 0;
    const pendingRequests = pendingRequestMap.get(item.id) || 0;
    const appointmentsCount = appointmentMap.get(item.id) || 0;
    const completedAppointments = completedAppointmentMap.get(item.id) || 0;
    const publicReady = Boolean(item.slug) && servicesCount > 0;
    const owner = unwrapOwner(item.profiles);
    const activityScore =
      servicesCount * 2 +
      customersCount +
      requestsCount * 3 +
      appointmentsCount * 4 +
      completedAppointments * 5 +
      (item.status === 'active' ? 8 : item.status === 'trial' ? 3 : -4);

    return {
      ...item,
      owner,
      servicesCount,
      customersCount,
      requestsCount,
      pendingRequests,
      appointmentsCount,
      completedAppointments,
      publicReady,
      activityScore
    };
  });

  const latestBusinesses = ((latestBusinessesRaw || []) as unknown as AdminBusinessBase[]).map((item) => ({
    ...item,
    owner: unwrapOwner(item.profiles),
    servicesCount: serviceMap.get(item.id) || 0,
    appointmentsCount: appointmentMap.get(item.id) || 0,
    requestsCount: requestMap.get(item.id) || 0,
    publicReady: Boolean(item.slug) && (serviceMap.get(item.id) || 0) > 0
  }));

  const topBusinesses = [...businesses]
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 5);

  const inactiveBusinesses = [...businesses]
    .filter((item) => item.status !== 'blocked' || item.servicesCount === 0 || item.appointmentsCount === 0)
    .sort((a, b) => a.activityScore - b.activityScore)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      needsAttention: [
        item.status === 'blocked' ? 'bloqueado' : null,
        item.servicesCount === 0 ? 'sem serviços' : null,
        item.requestsCount === 0 ? 'sem solicitações' : null,
        item.appointmentsCount === 0 ? 'sem agenda' : null,
        !item.publicReady ? 'página incompleta' : null
      ].filter(Boolean)
    }));

  return {
    summary: {
      businessesCount: businessesCount || 0,
      trialCount: trialCount || 0,
      activeCount: activeCount || 0,
      blockedCount: blockedCount || 0,
      ownersCount: ownersCount || 0,
      recurringRevenue: Number(activeCount || 0) * SINGLE_PLAN_PRICE,
      potentialRevenue: Number((activeCount || 0) + (trialCount || 0)) * SINGLE_PLAN_PRICE,
      businessesWithServices: new Set((services || []).map((item) => item.business_id)).size,
      businessesWithRequests: new Set((requests || []).map((item) => item.business_id)).size,
      businessesWithAppointments: new Set((appointments || []).map((item) => item.business_id)).size,
      publicReadyCount: businesses.filter((item) => item.publicReady).length,
      inactiveCount: businesses.filter((item) => item.activityScore <= 4).length
    },
    latestBusinesses,
    inactiveBusinesses,
    topBusinesses
  };
}
