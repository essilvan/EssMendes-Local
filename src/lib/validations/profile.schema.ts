import { z } from "zod";

export const updateProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, "O nome da empresa deve ter no mínimo 2 caracteres.")
    .max(100, "O nome da empresa não pode ultrapassar 100 caracteres."),
  description: z
    .string()
    .max(500, "A headline/descrição curta não pode ultrapassar 500 caracteres.")
    .optional()
    .or(z.literal("")),
  editorialSummary: z
    .string()
    .max(3000, "O texto sobre a empresa não pode ultrapassar 3000 caracteres.")
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
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor inválida. Use o formato HEX (ex: #0d9488).")
    .optional()
    .or(z.literal("")),
  googleMapsUrl: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().min(1).max(5).optional(),
  reviewCount: z.coerce.number().min(0).max(99999).optional(),
  placePhotos: z.string().optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
