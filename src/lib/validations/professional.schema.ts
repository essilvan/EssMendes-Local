import { z } from "zod";

export const professionalSchema = z.object({
  name: z
    .string()
    .min(2, "Nome do profissional deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres."),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine(
      (digits) => digits.length >= 10 && digits.length <= 13,
      "Informe um WhatsApp válido com DDD e número (mínimo 10 dígitos)."
    ),
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
  access_pin: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^\d{4}$/.test(val),
      "O PIN de acesso deve ter exatamente 4 dígitos numéricos."
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  receives_quotes: z.boolean().default(true),
  is_primary_quote_contact: z.boolean().default(false),
});

export type ProfessionalInput = z.input<typeof professionalSchema>;
