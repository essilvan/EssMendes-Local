import { z } from "zod";

export const professionalSchema = z.object({
  name: z
    .string()
    .min(2, "Nome do profissional deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres."),
  phone: z
    .string()
    .min(10, "Informe um WhatsApp válido com DDD (mínimo 10 dígitos).")
    .max(25, "Telefone muito longo."),
  role_title: z
    .string()
    .max(100, "Cargo/Especialidade deve ter no máximo 100 caracteres.")
    .optional()
    .nullable()
    .or(z.literal("")),
  specialty: z
    .string()
    .max(100, "Especialidade deve ter no máximo 100 caracteres.")
    .optional()
    .nullable()
    .or(z.literal("")),
  avatar_url: z
    .string()
    .url("URL da foto/avatar inválida.")
    .optional()
    .nullable()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type ProfessionalInput = z.infer<typeof professionalSchema>;
