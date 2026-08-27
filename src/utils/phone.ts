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
