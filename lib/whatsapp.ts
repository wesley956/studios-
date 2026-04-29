import { formatDateBR, formatTime } from '@/lib/utils';

export function normalizePhoneForWhatsapp(phone: string | null | undefined) {
  return String(phone || '').replace(/\D/g, '');
}

export function buildWhatsappUrl(phone: string | null | undefined, message: string) {
  const clean = normalizePhoneForWhatsapp(phone);
  if (!clean) return '#';
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function appointmentApprovedMessage(input: {
  businessName: string;
  customerName: string;
  serviceName?: string | null;
  date: string;
  time: string;
  address?: string | null;
}) {
  const service = input.serviceName ? ` para ${input.serviceName}` : '';
  const address = input.address ? `\nEndereço: ${input.address}` : '';
  return `Olá, ${input.customerName}! Seu horário${service} foi confirmado no ${input.businessName}: ${formatDateBR(input.date)} às ${formatTime(input.time)}.${address}\n\nQualquer imprevisto, avise por aqui. Obrigado!`;
}

export function appointmentReminderMessage(input: {
  businessName: string;
  customerName: string;
  serviceName?: string | null;
  date: string;
  time: string;
}) {
  const service = input.serviceName ? ` (${input.serviceName})` : '';
  return `Olá, ${input.customerName}! Passando para lembrar do seu horário no ${input.businessName}${service}: ${formatDateBR(input.date)} às ${formatTime(input.time)}. Te esperamos!`;
}

export function returnInviteMessage(input: {
  businessName: string;
  customerName: string;
  publicUrl?: string | null;
}) {
  const link = input.publicUrl ? `\nVocê também pode solicitar pelo link: ${input.publicUrl}` : '';
  return `Olá, ${input.customerName}! Tudo bem? Aqui é do ${input.businessName}. Estamos passando para saber se você quer agendar um novo horário.${link}`;
}

export function birthdayMessage(input: { businessName: string; customerName: string }) {
  return `Olá, ${input.customerName}! A equipe do ${input.businessName} deseja um feliz aniversário, com muita saúde, alegria e coisas boas. 🎉`;
}

export function paymentReminderMessage(input: { businessName: string; customerName: string; amount?: string }) {
  const amount = input.amount ? ` no valor de ${input.amount}` : '';
  return `Olá, ${input.customerName}! Aqui é do ${input.businessName}. Identificamos uma pendência${amount}. Pode nos chamar por aqui para combinar o pagamento?`;
}
