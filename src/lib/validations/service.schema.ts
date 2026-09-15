import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, "O nome do serviço deve ter no mínimo 2 caracteres.")
    .max(100, "O nome do serviço não pode ultrapassar 100 caracteres."),
  description: z
    .string()
    .max(500, "A descrição não pode ultrapassar 500 caracteres.")
    .optional()
    .or(z.literal("")),
  price: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }, z.number().min(0, "O preço não pode ser negativo.").nullable().optional()),
  durationMinutes: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined || val === "0" || val === 0) return null;
    const num = Number(val);
    return isNaN(num) || num <= 0 ? null : num;
  }, z.number().int("A duração deve ser um número inteiro de minutos.").min(0, "A duração não pode ser negativa.").max(720, "A duração máxima é de 720 minutos (12 horas).").nullable().optional()),
  showDuration: z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    return val === "true" || val === "on";
  }, z.boolean().optional().default(false)),
  isActive: z.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
