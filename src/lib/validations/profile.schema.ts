import { z } from "zod";

export const updateProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, "O nome da empresa deve ter no mínimo 2 caracteres.")
    .max(100, "O nome da empresa não pode ultrapassar 100 caracteres."),
  description: z
    .string()
    .max(500, "A descrição não pode ultrapassar 500 caracteres.")
    .optional()
    .or(z.literal("")),
  phoneWhatsapp: z
    .string()
    .max(25, "O telefone/WhatsApp informado é inválido.")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(255, "O endereço não pode ultrapassar 255 caracteres.")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .url("Informe uma URL de imagem válida para o logo.")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
