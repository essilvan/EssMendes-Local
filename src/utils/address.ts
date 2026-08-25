/**
 * Utilitários para tratamento e extração inteligente de endereços brasileiros.
 */

/**
 * Extrai o Bairro, Cidade e UF a partir de um endereço completo no formato brasileiro.
 *
 * Exemplos tratados:
 * - "QNA 10 Lote 05 - Taguatinga, Brasília - DF, 72110-010, Brasil" -> "Taguatinga, Brasília - DF"
 * - "Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brasil" -> "Bela Vista, São Paulo - SP"
 * - "Rua das Flores, 123 - Centro, Curitiba - PR, 80020-000, Brasil" -> "Centro, Curitiba - PR"
 * - "Taguatinga, Brasília - DF" -> "Taguatinga, Brasília - DF"
 * - "São Paulo - SP, Brasil" -> "São Paulo - SP"
 */
export function extractNeighborhoodAndCity(address?: string | null): string {
  if (!address || !address.trim()) return "";

  let clean = address.trim();

  // 1. Remove país no final (ex: ", Brasil" ou "Brasil")
  clean = clean.replace(/,?\s*Brasil\s*$/i, "").trim();

  // 2. Remove CEP completo (ex: "72110-010", "72110010", "72110 010")
  clean = clean.replace(/,?\s*\b\d{5}[-\s]?\d{3}\b/g, "").trim();

  // 3. Remove dígitos residuais de CEP no final (ex: ", 010" ou ", 72110")
  clean = clean.replace(/,?\s*\b\d{3,5}\b$/g, "").trim();

  // 4. Se tiver formato com hífen duplo ou espaçado: "Logradouro - Bairro, Cidade - UF"
  if (clean.includes(" - ")) {
    const firstHyphenIndex = clean.indexOf(" - ");
    const afterFirstHyphen = clean.substring(firstHyphenIndex + 3).trim();

    // Se a parte após o primeiro hífen não for apenas a UF (ex: "DF" ou "SP")
    if (afterFirstHyphen.length > 2 && !/^[A-Z]{2}$/i.test(afterFirstHyphen)) {
      return afterFirstHyphen;
    }
  }

  // 5. Se tiver hífen simples separando logradouro de bairro/cidade
  const hyphenParts = clean.split("-").map((p) => p.trim());
  if (hyphenParts.length >= 3) {
    // Ex: "Rua X 10" - "Bairro, Cidade" - "UF" -> "Bairro, Cidade - UF"
    return `${hyphenParts.slice(1, -1).join(" - ")} - ${hyphenParts[hyphenParts.length - 1]}`;
  }

  // 6. Se for separado por vírgulas: "Rua X, 123, Bairro, Cidade - UF"
  const commaParts = clean.split(",").map((p) => p.trim()).filter(Boolean);
  if (commaParts.length >= 3) {
    return commaParts.slice(-2).join(", ");
  } else if (commaParts.length === 2 && !/^\d+$/.test(commaParts[1])) {
    return commaParts[1];
  }

  return clean;
}

/**
 * Sanitiza descrições que possam conter fragmentos corrompidos de CEP
 * (ex: "em 010, Brasil" ou "em 72110-010, Brasil") substituindo pela
 * localização correta (Bairro/Cidade ou "na sua região").
 */
export function sanitizeDescription(
  description?: string | null,
  address?: string | null
): string {
  if (!description) return "";

  // Procura padrões como "em 010, Brasil", "em 72110-010, Brasil", "em 010."
  const badLocationRegex = /\s+em\s+\d{3,5}(?:-\d{3})?(?:,\s*Brasil)?([.!]?)/gi;

  if (badLocationRegex.test(description)) {
    const loc = extractNeighborhoodAndCity(address);
    const replacement = loc ? ` em ${loc}$1` : ` na sua região$1`;
    return description.replace(badLocationRegex, replacement);
  }

  return description;
}
