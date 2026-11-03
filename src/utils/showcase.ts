import React from "react";
import type { Service, TenantProfile } from "@/types";
import {
  Sparkles,
  Scissors,
  Wrench,
  CarFront,
  Gauge,
  Disc,
  UtensilsCrossed,
  Flame,
  Wine,
  Soup,
  Coffee,
  Cake,
  Cookie,
  Cherry,
  Dog,
  Cat,
  Bone,
  PawPrint,
  HeartPulse,
  Award,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
} from "lucide-react";

/**
 * 1. Subtítulo Dinâmico do Hero com Fallback Seguro por Nicho
 * Prioridade: tenant.description -> tenant.headline -> profile.description -> profile.editorial_summary -> Fallback por Nicho
 */
export function getHeroSubtitle(
  tenant?: any,
  profile?: TenantProfile | null,
  niche?: string | null,
  category?: string | null
): string {
  const directText =
    (typeof tenant?.description === "string" && tenant.description.trim()) ||
    (typeof tenant?.headline === "string" && tenant.headline.trim()) ||
    (typeof profile?.description === "string" && profile.description.trim()) ||
    (typeof profile?.editorial_summary === "string" && profile.editorial_summary.trim());

  if (directText) {
    return directText;
  }

  const tenantName = tenant?.name || profile?.name || "nosso estabelecimento";
  const combined = `${niche || ""} ${category || ""} ${tenant?.category || ""} ${tenant?.theme_niche || ""}`.toLowerCase();

  if (combined.includes("pet") || combined.includes("veterin") || combined.includes("animal")) {
    return `Cuidado dedicado, atendimento humanizado e os melhores serviços para a saúde e o bem-estar do seu pet no ${tenantName}.`;
  }
  if (combined.includes("auto") || combined.includes("mecanic") || combined.includes("oficina")) {
    return `Manutenção preventiva e corretiva, diagnóstico avançado e peças de procedência com total segurança e garantia no ${tenantName}.`;
  }
  if (
    combined.includes("barbea") ||
    combined.includes("barber") ||
    combined.includes("salao") ||
    combined.includes("cabel") ||
    combined.includes("estetica") ||
    combined.includes("beleza") ||
    combined.includes("spa")
  ) {
    return `Cortes personalizados, cuidados estéticos de alto padrão e profissionais experientes para valorizar o seu estilo no ${tenantName}.`;
  }
  if (
    combined.includes("confeit") ||
    combined.includes("bolo") ||
    combined.includes("doceria") ||
    combined.includes("bakery")
  ) {
    return `Bolos artesanais, doces finos e tortas especiais preparados com ingredientes nobres e carinho para momentos inesquecíveis no ${tenantName}.`;
  }
  if (
    combined.includes("restauran") ||
    combined.includes("gastro") ||
    combined.includes("food") ||
    combined.includes("lanche") ||
    combined.includes("pizza")
  ) {
    return `Experiência gastronômica marcante, ingredientes frescos e cardápio autoral para celebrar momentos únicos no ${tenantName}.`;
  }
  if (
    combined.includes("dentis") ||
    combined.includes("odonto") ||
    combined.includes("saude") ||
    combined.includes("medic")
  ) {
    return `Atendimento de saúde especializado, tecnologia de ponta e cuidado humanizado para você e sua família no ${tenantName}.`;
  }

  return `Conheça nossos serviços e produtos especializados e agende seu horário com praticidade e excelência no ${tenantName}.`;
}

/**
 * 2. Pills / Badges de Destaque Dinâmicos no Hero
 * Prioridade:
 * 1. tenant.highlights (se cadastrado no banco)
 * 2. tenant.tags (se cadastrado no banco)
 * 3. 3 ou 4 principais serviços cadastrados na tabela `services` (tenant?.services?.slice(0, 4) ou services prop)
 * 4. Fallback contextual a partir das categorias reais do estabelecimento (nunca dados arbitrários)
 */
export function getHeroPills(
  tenant?: any,
  services?: Service[],
  niche?: string | null,
  category?: string | null
): string[] {
  // 1. tenant.highlights do banco
  if (Array.isArray(tenant?.highlights) && tenant.highlights.length > 0) {
    const list = tenant.highlights
      .map((h: any) => (typeof h === "string" ? h.trim() : h?.title || h?.name || ""))
      .filter((s: string) => Boolean(s) && s.length > 0);
    if (list.length > 0) return list.slice(0, 4);
  }

  // 2. tenant.tags do banco
  if (Array.isArray(tenant?.tags) && tenant.tags.length > 0) {
    const list = tenant.tags
      .map((t: any) => (typeof t === "string" ? t.trim() : ""))
      .filter((s: string) => Boolean(s) && s.length > 0);
    if (list.length > 0) return list.slice(0, 4);
  }

  // 3. Serviços reais cadastrados no Supabase (usando optional chaining)
  const activeServicesList = tenant?.services || services;
  if (Array.isArray(activeServicesList) && activeServicesList.length > 0) {
    const list = activeServicesList
      .slice(0, 4)
      .map((s: any) => s?.name?.trim())
      .filter((name: any): name is string => typeof name === "string" && name.length > 0);
    if (list.length > 0) return list;
  }

  // 4. Categorias reais cadastradas
  const categorySource = [
    category,
    tenant?.category,
    ...(Array.isArray(tenant?.google_types) ? tenant.google_types : []),
  ]
    .filter(Boolean)
    .map((c) => String(c).trim());

  if (categorySource.length > 0) {
    return Array.from(new Set(categorySource)).slice(0, 4);
  }

  return [];
}

/**
 * 3. Seletor de Ícones Dinâmicos baseado no nome do serviço ou nicho
 */
export function getServiceIcon(
  serviceName: string = "",
  niche: string = ""
): React.ComponentType<{ className?: string }> {
  const normalized = `${serviceName} ${niche}`.toLowerCase();

  // Animais / Pet
  if (normalized.includes("banho") || normalized.includes("tosa") || normalized.includes("estética pet")) {
    return Scissors;
  }
  if (normalized.includes("gato") || normalized.includes("felin") || normalized.includes("cat")) {
    return Cat;
  }
  if (normalized.includes("veterin") || normalized.includes("consulta") || normalized.includes("vacina")) {
    return HeartPulse;
  }
  if (normalized.includes("pet") || normalized.includes("cachorro") || normalized.includes("cão")) {
    return Dog;
  }
  if (normalized.includes("petisco") || normalized.includes("ração") || normalized.includes("mimo")) {
    return Bone;
  }

  // Automotivo
  if (normalized.includes("diagnóstic") || normalized.includes("scanner") || normalized.includes("eletrônic")) {
    return Gauge;
  }
  if (normalized.includes("freio") || normalized.includes("suspens") || normalized.includes("disco") || normalized.includes("roda")) {
    return Disc;
  }
  if (normalized.includes("mecânic") || normalized.includes("motor") || normalized.includes("revis") || normalized.includes("óleo")) {
    return Wrench;
  }
  if (normalized.includes("auto") || normalized.includes("carro") || normalized.includes("veícul") || normalized.includes("lataria")) {
    return CarFront;
  }

  // Gastronomia / Restaurante
  if (normalized.includes("brasa") || normalized.includes("fogo") || normalized.includes("churras") || normalized.includes("grelh")) {
    return Flame;
  }
  if (normalized.includes("vinho") || normalized.includes("drink") || normalized.includes("bar") || normalized.includes("cocktail")) {
    return Wine;
  }
  if (normalized.includes("prato") || normalized.includes("almoço") || normalized.includes("jantar") || normalized.includes("cardápio")) {
    return UtensilsCrossed;
  }
  if (normalized.includes("sopa") || normalized.includes("caldo")) {
    return Soup;
  }
  if (normalized.includes("café") || normalized.includes("lanche")) {
    return Coffee;
  }

  // Confeitaria / Doces
  if (normalized.includes("bolo") || normalized.includes("torta")) {
    return Cake;
  }
  if (normalized.includes("doce") || normalized.includes("brigadeiro") || normalized.includes("cookie")) {
    return Cookie;
  }
  if (normalized.includes("fruta") || normalized.includes("cereja") || normalized.includes("sobremesa")) {
    return Cherry;
  }

  // Barbearia / Salão / Estética
  if (normalized.includes("cabel") || normalized.includes("barba") || normalized.includes("corte")) {
    return Scissors;
  }

  return Sparkles;
}

/**
 * Detecta se o estabelecimento pertence ao nicho Automotivo / Mecânica (`auto`, `mecanica`, `automotive`, `oficina`)
 */
export function isAutomotiveNiche(
  tenant?: any,
  profile?: TenantProfile | null,
  niche?: string | null
): boolean {
  const combined = `${niche || ""} ${tenant?.theme_niche || ""} ${tenant?.theme_settings?.niche || ""} ${tenant?.category || ""} ${tenant?.segment || ""} ${tenant?.template || ""} ${profile?.business_category || ""} ${profile?.template_id || ""} ${(tenant?.google_types || []).join(" ")}`.toLowerCase();
  return (
    combined.includes("auto") ||
    combined.includes("mecanic") ||
    combined.includes("mecânic") ||
    combined.includes("oficina") ||
    combined.includes("funilaria") ||
    combined.includes("car_repair")
  );
}

/**
 * 4. Botão de CTA Dinâmico
 * Regras:
 * - Se tenant.cta_text estiver configurado, utiliza-o diretamente.
 * - Caso contrário, aplica a regra pelo nicho:
 *   * Veterinária/Pet: "Agendar Atendimento"
 *   * Automotivo: "Solicitar Orçamento do Veículo"
 *   * Barbearia/Estética: "Agendar Horário"
 *   * Confeitaria: "Fazer Encomenda / Orçamento"
 *   * Restaurante: "Reservar Mesa / Pedir"
 *   * Demais nichos: "Agendar Horário"
 */
export function getCtaButtonText(
  tenant?: any,
  niche?: string | null,
  category?: string | null
): string {
  if (tenant?.cta_text && typeof tenant.cta_text === "string" && tenant.cta_text.trim()) {
    return tenant.cta_text.trim();
  }
  if (
    tenant?.theme_settings?.cta_text &&
    typeof tenant.theme_settings.cta_text === "string" &&
    tenant.theme_settings.cta_text.trim()
  ) {
    return tenant.theme_settings.cta_text.trim();
  }

  const combined = `${niche || ""} ${category || ""} ${tenant?.category || ""} ${tenant?.theme_niche || ""}`.toLowerCase();

  // 1. Veterinária / Pet
  if (combined.includes("pet") || combined.includes("veterin") || combined.includes("animal")) {
    return "Agendar Atendimento";
  }

  // 2. Automotivo
  if (
    combined.includes("auto") ||
    combined.includes("mecanic") ||
    combined.includes("mecânic") ||
    combined.includes("oficina")
  ) {
    return "Solicitar Orçamento do Veículo";
  }

  // 3. Barbearia / Estética / Salão
  if (
    combined.includes("barbea") ||
    combined.includes("barber") ||
    combined.includes("salao") ||
    combined.includes("cabel") ||
    combined.includes("estetica") ||
    combined.includes("beleza") ||
    combined.includes("spa")
  ) {
    return "Agendar Horário";
  }

  // 4. Confeitaria / Doceria
  if (
    combined.includes("confeit") ||
    combined.includes("bolo") ||
    combined.includes("doceria") ||
    combined.includes("bakery")
  ) {
    return "Fazer Encomenda / Orçamento";
  }

  // 5. Gastronomia / Restaurante
  if (
    combined.includes("restauran") ||
    combined.includes("gastro") ||
    combined.includes("food") ||
    combined.includes("lanche") ||
    combined.includes("pizza")
  ) {
    return "Reservar Mesa / Pedir";
  }

  // 6. Padrão
  return "Agendar Horário";
}

/**
 * Formatação de moeda no padrão brasileiro
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}
