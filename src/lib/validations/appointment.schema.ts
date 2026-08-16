import { z } from "zod";

export const appointmentSchema = z.object({
  tenantId: z.string().uuid("ID do estabelecimento inválido."),
  serviceId: z.string().uuid("Selecione um serviço válido."),
  serviceName: z.string().min(1, "Nome do serviço é obrigatório."),
  price: z.coerce.number().min(0, "Preço inválido."),
  durationMinutes: z.coerce.number().min(5, "Duração mínima é de 5 minutos."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM."),
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres.").max(100),
  customerPhone: z.string().min(10, "Informe um telefone/WhatsApp válido com DDD."),
  customerEmail: z
    .string()
    .email("E-mail com formato inválido.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const availableSlotsQuerySchema = z.object({
  tenantId: z.string().uuid("ID do estabelecimento inválido."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD."),
  totalDuration: z.coerce.number().min(5, "Duração mínima é de 5 minutos.").default(30),
});

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
