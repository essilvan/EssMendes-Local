export function sanitizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  // Se não tiver o DDI 55 (Brasil), adiciona
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function generateWhatsAppUrl(
  phone: string,
  businessNameOrMessage: string,
  customMessage?: string
): string {
  const sanitized = sanitizePhoneNumber(phone);
  if (!sanitized) return "#";
  const text = customMessage
    ? customMessage
    : businessNameOrMessage.startsWith("👋") || businessNameOrMessage.startsWith("Olá")
    ? businessNameOrMessage
    : `Olá! Encontrei o ${businessNameOrMessage} pela internet e gostaria de mais informações sobre os serviços.`;
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`;
}

/**
 * Formata telefone brasileiro para o padrão de WhatsApp (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatBrazilianPhone(phone: string): string {
  if (!phone) return "";

  // Remove caracteres especiais
  let digits = phone.replace(/\D/g, "");

  // Se inicia com código de país 55 (Brasil) e tem 12 ou 13 dígitos
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  // Celular brasileiro com 9 dígitos (DDD + 9 dígitos = 11 dígitos)
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  // Telefone fixo brasileiro (DDD + 8 dígitos = 10 dígitos)
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // Se for qualquer outro tamanho, retorna limpo ou o original
  return phone.trim();
}
