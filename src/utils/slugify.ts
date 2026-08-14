export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres inválidos
    .replace(/\s+/g, "-") // Substitui espaços por traços
    .replace(/-+/g, "-"); // Remove traços duplicados
}
