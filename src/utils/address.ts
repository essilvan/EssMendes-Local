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
/**
 * Remove complementos de logradouro (ex: "Lj 01", "Loja 02", "Qd 10", "Lote 05", "Sala 3", "Bloco B")
 * do início de um trecho de cidade/bairro.
 */
function stripAddressComplementPrefix(text: string): string {
  return text
    .replace(
      /^(?:(?:lj|loja|qd|quadra|lt|lote|sl|sala|bl|bloco|conj|conjunto|apto|apt|n[º°]?|sn|s\/n|cs|casa|ch|ch[aá]cara|setor|st|q[a-z]{1,3})\s*[a-z0-9./-]*\s*[-–,/\s]+)+/gi,
      ""
    )
    .replace(/^[-–,\s]+/, "")
    .trim();
}

export function extractNeighborhoodAndCity(address?: string | null): string {
  if (!address || !address.trim()) return "";

  let clean = address.trim();

  // 1. Remove país no final (ex: ", Brasil" ou "Brasil")
  clean = clean.replace(/,?\s*Brasil\s*$/i, "").trim();

  // 2. Remove CEP completo (ex: "72110-010", "72110010", "72110 010")
  clean = clean.replace(/,?\s*\b\d{5}[-\s]?\d{3}\b/g, "").trim();

  // 3. Remove dígitos residuais de CEP no final (ex: ", 010" ou ", 72110")
  clean = clean.replace(/,?\s*\b\d{3,5}\b$/g, "").trim();

  // 4. Se tiver formato com múltiplos " - " (ex: "QNA 10 - Lj 01 - Taguatinga, Brasília - DF")
  if (clean.includes(" - ")) {
    const segments = clean.split(" - ").map((s) => s.trim()).filter(Boolean);
    if (segments.length >= 2) {
      const last = segments[segments.length - 1];
      // Se o último segmento for UF (ex: "DF", "SP"), pega o penúltimo + UF
      if (/^[A-Z]{2}$/i.test(last) && segments.length >= 2) {
        const cityPart = stripAddressComplementPrefix(segments[segments.length - 2]);
        if (cityPart) return `${cityPart} - ${last.toUpperCase()}`;
      }
      // Caso contrário, pega o último segmento após o último hífen (se não for apenas número/complemento)
      const candidate = stripAddressComplementPrefix(
        segments.slice(1).join(" - ")
      );
      if (candidate && candidate.length > 2) {
        return candidate;
      }
    }
  }

  // 5. Se tiver hífen simples separando logradouro de bairro/cidade
  const hyphenParts = clean.split("-").map((p) => p.trim()).filter(Boolean);
  if (hyphenParts.length >= 3) {
    const middle = stripAddressComplementPrefix(
      hyphenParts.slice(1, -1).join(" - ")
    );
    if (middle) {
      return `${middle} - ${hyphenParts[hyphenParts.length - 1]}`;
    }
  }

  // 6. Se for separado por vírgulas: "Rua X, Lj 01, Bairro, Cidade - UF"
  const commaParts = clean.split(",").map((p) => p.trim()).filter(Boolean);
  if (commaParts.length >= 3) {
    const cleanedTail = commaParts
      .slice(-2)
      .map(stripAddressComplementPrefix)
      .filter(Boolean);
    if (cleanedTail.length > 0) return cleanedTail.join(", ");
  } else if (commaParts.length === 2 && !/^\d+$/.test(commaParts[1])) {
    return stripAddressComplementPrefix(commaParts[1]) || commaParts[1];
  }

  return stripAddressComplementPrefix(clean) || clean;
}

/**
 * Sanitiza descrições que possam conter fragmentos corrompidos de CEP ou complementos de endereço
 * (ex: "em 010, Brasil", "em Lj 01 - Taguatinga") substituindo pela localização limpa.
 */
export function sanitizeDescription(
  description?: string | null,
  address?: string | null
): string {
  if (!description) return "";

  let result = description;
  const cleanLoc = extractNeighborhoodAndCity(address);

  // 1. Procura padrões como "em 010, Brasil", "em 72110-010, Brasil", "em 010."
  const badLocationRegex = /\s+em\s+\d{3,5}(?:-\d{3})?(?:,\s*Brasil)?([.!]?)/gi;
  if (badLocationRegex.test(result)) {
    const replacement = cleanLoc ? ` em ${cleanLoc}$1` : ` na sua região$1`;
    result = result.replace(badLocationRegex, replacement);
  }

  // 2. Remove complementos como "em Lj 01 - Taguatinga" -> "em Taguatinga"
  result = result.replace(
    /\bem\s+(?:(?:lj|loja|qd|quadra|lt|lote|sl|sala|bl|bloco)\s*[a-z0-9./-]*\s*[-–,/\s]+)+/gi,
    "em "
  );

  return result;
}
