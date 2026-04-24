import { z } from 'zod';

export const bookingRequestSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid().optional().or(z.literal('')),
  requestedDate: z.string().min(1, 'Selecione a data'),
  requestedTime: z.string().min(1, 'Selecione o horário'),
  customerName: z.string().min(3, 'Informe seu nome'),
  customerPhone: z.string().min(10, 'Informe seu WhatsApp'),
  notes: z.string().optional()
});
