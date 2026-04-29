import { createAdminClient } from '@/lib/supabase/admin';

export type AuditAction =
  | 'business.updated'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'booking_request.approved'
  | 'booking_request.cancelled'
  | 'appointment.updated'
  | 'subscription.created_or_updated'
  | 'auth.password_recovery_requested';

export async function logAuditEvent(input: {
  businessId?: string | null;
  actorId?: string | null;
  action: AuditAction | string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      business_id: input.businessId || null,
      actor_id: input.actorId || null,
      action: input.action,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      metadata: input.metadata || {}
    });
  } catch {
    // Auditoria nunca deve quebrar a ação principal.
  }
}
