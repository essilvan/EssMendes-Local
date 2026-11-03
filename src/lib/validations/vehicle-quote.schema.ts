import { z } from "zod";

/**
 * Normaliza placa removendo traços/espaços e convertendo para maiúsculas (ex: "ABC-1234" -> "ABC1234")
 */
export function normalizeLicensePlate(raw: string): string {
  return (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

/**
 * Formata placa para exibição visual amigável (Mercosul ABC1D23 ou Antiga ABC-1234)
 */
export function formatLicensePlateDisplay(raw: string): string {
  const clean = normalizeLicensePlate(raw);
  if (/^[A-Z]{3}[0-9]{4}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

/**
 * Detecta tags automáticas de categoria mecânica com base no relato do problema
 */
export function extractAutomotiveCategoryTags(
  complaint: string,
  explicitTags?: string[]
): string[] {
  const tags = new Set<string>(explicitTags || []);
  const text = (complaint || "").toLowerCase();

  if (text.includes("freio") || text.includes("pastilha") || text.includes("disco")) {
    tags.add("Freios");
  }
  if (
    text.includes("óleo") ||
    text.includes("oleo") ||
    text.includes("filtro")
  ) {
    tags.add("Troca de Óleo");
  }
  if (
    text.includes("suspens") ||
    text.includes("amortecedor") ||
    text.includes("barulho") ||
    text.includes("bucha") ||
    text.includes("bandeja")
  ) {
    tags.add("Suspensão");
  }
  if (
    text.includes("motor") ||
    text.includes("correia") ||
    text.includes("cabeçote") ||
    text.includes("cabecote") ||
    text.includes("aquecendo") ||
    text.includes("vazamento")
  ) {
    tags.add("Motor");
  }
  if (
    text.includes("elétric") ||
    text.includes("eletric") ||
    text.includes("bateria") ||
    text.includes("alternador") ||
    text.includes("partida")
  ) {
    tags.add("Elétrica");
  }
  if (
    text.includes("injeção") ||
    text.includes("injecao") ||
    text.includes("scanner") ||
    text.includes("luz") ||
    text.includes("painel") ||
    text.includes("falhando")
  ) {
    tags.add("Diagnóstico / Scanner");
  }
  if (
    text.includes("embreagem") ||
    text.includes("câmbio") ||
    text.includes("cambio") ||
    text.includes("marcha")
  ) {
    tags.add("Câmbio / Embreagem");
  }
  if (
    text.includes("revisão") ||
    text.includes("revisao") ||
    text.includes("preventiva") ||
    text.includes("viagem")
  ) {
    tags.add("Revisão Geral");
  }
  if (
    text.includes("alinhamento") ||
    text.includes("balanceamento") ||
    text.includes("pneu") ||
    text.includes("direção") ||
    text.includes("direcao")
  ) {
    tags.add("Alinhamento & Pneus");
  }
  if (text.includes("ar condicionado") || text.includes("ar-condicionado") || text.includes("gelando")) {
    tags.add("Ar-Condicionado");
  }

  if (tags.size === 0 && text.trim().length > 0) {
    tags.add("Avaliação Mecânica");
  }

  return Array.from(tags);
}

/**
 * Schema para solicitação pública de orçamento na vitrine
 */
export const publicVehicleQuoteSchema = z.object({
  tenantId: z.string().uuid("ID da oficina inválido."),
  licensePlate: z
    .string()
    .trim()
    .min(6, "Informe uma placa válida (ex: ABC-1234 ou ABC1D23).")
    .max(10, "Placa inválida."),
  vehicleModel: z
    .string()
    .trim()
    .min(2, "Informe o modelo e ano do veículo (ex: Honda Civic 2020).")
    .max(120, "Modelo/Ano muito longo."),
  complaint: z
    .string()
    .trim()
    .min(3, "Descreva brevemente o problema ou serviço desejado.")
    .max(1500, "Descrição muito longa."),
  clientName: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(120, "Nome muito longo."),
  clientPhone: z
    .string()
    .trim()
    .min(8, "Informe um WhatsApp válido com DDD.")
    .max(30, "WhatsApp inválido."),
  categoryTags: z.array(z.string()).optional(),
});

export type PublicVehicleQuoteInput = z.infer<typeof publicVehicleQuoteSchema>;

/**
 * Schema para criação/atualização administrativa de orçamento pelo mecânico/lojista
 */
export const adminVehicleQuoteSchema = z.object({
  licensePlate: z
    .string()
    .trim()
    .min(6, "Informe uma placa válida.")
    .max(10, "Placa inválida."),
  vehicleModel: z
    .string()
    .trim()
    .min(2, "Informe o modelo e ano do veículo.")
    .max(120, "Modelo muito longo."),
  complaint: z.string().trim().max(1500).optional().nullable(),
  clientName: z.string().trim().min(2, "Informe o nome do cliente.").max(120),
  clientPhone: z.string().trim().min(8, "Informe o WhatsApp do cliente.").max(30),
  categoryTags: z.array(z.string()).optional(),
  status: z
    .enum(["pending", "quoted", "approved", "in_progress", "completed", "canceled"])
    .default("pending"),
  laborCost: z.coerce.number().min(0).default(0),
  partsCost: z.coerce.number().min(0).default(0),
  mechanicNotes: z.string().trim().max(2000).optional().nullable(),
  scheduledFor: z.string().optional().nullable(),
});

export type AdminVehicleQuoteInput = z.infer<typeof adminVehicleQuoteSchema>;

export const updateVehicleQuoteSchema = z.object({
  id: z.string().uuid("ID do orçamento inválido."),
  licensePlate: z.string().trim().min(5).max(10).optional(),
  vehicleModel: z.string().trim().max(120).optional().nullable(),
  complaint: z.string().trim().max(1500).optional().nullable(),
  clientName: z.string().trim().min(2).max(120).optional(),
  clientPhone: z.string().trim().min(8).max(30).optional(),
  status: z
    .enum(["pending", "quoted", "approved", "in_progress", "completed", "canceled"])
    .optional(),
  laborCost: z.coerce.number().min(0).optional(),
  partsCost: z.coerce.number().min(0).optional(),
  mechanicNotes: z.string().trim().max(2000).optional().nullable(),
  scheduledFor: z.string().optional().nullable(),
  categoryTags: z.array(z.string()).optional(),
});

export type UpdateVehicleQuoteInput = z.infer<typeof updateVehicleQuoteSchema>;

/**
 * Schema para Revisões Preventivas (vehicle_maintenance_schedules)
 */
export const maintenanceScheduleSchema = z.object({
  licensePlate: z
    .string()
    .trim()
    .min(5, "Informe uma placa válida.")
    .max(10, "Placa inválida."),
  vehicleModel: z.string().trim().max(120).optional().nullable(),
  clientName: z.string().trim().min(2, "Informe o nome do cliente.").max(120),
  clientPhone: z.string().trim().min(8, "Informe o WhatsApp do cliente.").max(30),
  serviceType: z
    .string()
    .trim()
    .min(2, "Informe o tipo de revisão/serviço preventivo.")
    .max(150),
  lastServiceDate: z.string().optional().nullable(),
  dueDate: z.string().min(8, "Informe a data de vencimento da revisão."),
  dueKm: z.coerce.number().int().positive().optional().nullable(),
  status: z
    .enum(["scheduled", "notified", "completed", "overdue", "canceled"])
    .default("scheduled"),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type MaintenanceScheduleInput = z.infer<typeof maintenanceScheduleSchema>;

export const updateMaintenanceScheduleSchema = maintenanceScheduleSchema.partial().extend({
  id: z.string().uuid("ID da revisão inválido."),
});

export type UpdateMaintenanceScheduleInput = z.infer<typeof updateMaintenanceScheduleSchema>;

