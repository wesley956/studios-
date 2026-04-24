import Link from 'next/link';
import { updateBusinessAdmin } from '@/actions/admin-businesses';
import { Field, Input, Select, SubmitButton, Textarea } from '@/components/shared/forms';
import { SectionCard, StatCard, StatusBadge, TopHeading } from '@/components/shared/shell';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { currencyBRL, formatDateBR, statusLabel } from '@/lib/utils';

export default async function AdminClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { count: servicesCount }, { count: customersCount }, { count: requestsCount }, { data: appointments }, { data: payments }] = await Promise.all([
    supabase.from('businesses').select('id, business_name, city, status, plan_name, slug, tagline, description, whatsapp, instagram, address, created_at, profiles:owner_id(full_name,email)').eq('id', id).single(),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('appointments').select('id, status, final_price, appointment_date, appointment_time, customers(full_name), services(name)').eq('business_id', id).order('appointment_date', { ascending: false }).limit(6),
    supabase.from('payments').select('final_amount, payment_status, paid_at').eq('business_id', id)
  ]);

  const business = data;
  const owner = business ? (Array.isArray(business.profiles) ? business.profiles[0] : business.profiles) : null;
  const totalRevenue = (payments || []).filter((item) => item.payment_status === 'paid').reduce((sum, item) => sum + Number(item.final_amount || 0), 0);

  async function handleUpdateBusinessAdmin(formData: FormData): Promise<void> {
    'use server';
    await updateBusinessAdmin(formData);
  }

  return (
    <div>
      <TopHeading title={business?.business_name || 'Cliente'} description="Visão consolidada do negócio, com performance, receita e ações rápidas de gestão." action={business ? <a href={`/${business.slug}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-white px-5 py-3">Abrir página pública</a> : null} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Serviços" value={servicesCount || 0} />
        <StatCard label="Clientes" value={customersCount || 0} />
        <StatCard label="Solicitações" value={requestsCount || 0} />
        <StatCard label="Receita registrada" value={currencyBRL(totalRevenue)} tone="success" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SectionCard title="Dados do cliente" description="Atualize plano, status e informações principais do studio.">
          <form action={handleUpdateBusinessAdmin} className="grid gap-4">
            <input type="hidden" name="businessId" value={business?.id || ''} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome do negócio"><Input name="businessName" defaultValue={business?.business_name || ''} /></Field>
              <Field label="Slug"><Input name="slug" defaultValue={business?.slug || ''} /></Field>
              <Field label="Plano">
                <Select name="planName" defaultValue={business?.plan_name || 'start'}>
                  <option value="start">Start</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue={business?.status || 'trial'}>
                  <option value="trial">Teste</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </Select>
              </Field>
              <Field label="Cidade"><Input name="city" defaultValue={business?.city || ''} /></Field>
              <Field label="WhatsApp"><Input name="whatsapp" defaultValue={business?.whatsapp || ''} /></Field>
              <Field label="Instagram"><Input name="instagram" defaultValue={business?.instagram || ''} /></Field>
              <Field label="Tagline"><Input name="tagline" defaultValue={business?.tagline || ''} /></Field>
              <Field label="Endereço" className="md:col-span-2"><Input name="address" defaultValue={business?.address || ''} /></Field>
              <Field label="Descrição" className="md:col-span-2"><Textarea name="description" rows={4} defaultValue={business?.description || ''} /></Field>
            </div>
            <SubmitButton>Salvar alterações do cliente</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="Responsável e atividade" description="Saiba quem é a dona do negócio e acompanhe a operação recente.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted">Responsável</p>
              <p className="mt-1 font-medium">{owner?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="mt-1 font-medium">{owner?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Status atual</p>
              <div className="mt-2"><StatusBadge status={business?.status === 'active' ? 'success' : business?.status === 'trial' ? 'warning' : 'danger'}>{statusLabel(business?.status || '')}</StatusBadge></div>
            </div>
            <div>
              <p className="text-sm text-muted">Criado em</p>
              <p className="mt-1 font-medium">{formatDateBR(business?.created_at?.slice(0, 10))}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-border pt-6">
            <h4 className="text-lg font-serif">Últimos atendimentos</h4>
            {appointments?.length ? appointments.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{(item.customers as { full_name?: string } | null)?.full_name || 'Cliente'}</p>
                    <p className="text-sm text-muted">{(item.services as { name?: string } | null)?.name || 'Serviço'} • {formatDateBR(item.appointment_date)} às {item.appointment_time?.slice(0, 5)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.status === 'completed' ? 'success' : item.status === 'confirmed' ? 'neutral' : 'danger'}>{statusLabel(item.status)}</StatusBadge>
                    <p className="mt-2 text-sm font-medium">{currencyBRL(item.final_price)}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-muted">Sem atividade recente ainda.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
