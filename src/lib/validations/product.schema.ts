import { z } from "zod";

export const ProductSchema = z.object({
  name: z
    .string()
    .min(2, "Nome do produto deve ter pelo menos 2 caracteres")
    .max(255, "Nome muito longo"),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "O preço deve ser maior ou igual a zero"),
  promotional_price: z.coerce.number().optional().nullable(),
  image_url: z.string().url("URL de imagem inválida").optional().or(z.literal("")),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  display_order: z.coerce.number().default(0),
});

export type ProductInput = z.infer<typeof ProductSchema>;
