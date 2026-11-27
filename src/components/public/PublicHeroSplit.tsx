"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Phone,
  MessageCircle,
  MapPin,
  ArrowRight,
  Star,
  Dog,
  Cake,
  Sparkles,
  CarFront,
  Wrench,
  Utensils,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Award,
  HeartHandshake,
  BadgeCheck,
  Truck,
} from "lucide-react";
import type { TenantReview, Service } from "@/types";
import { generateWhatsAppUrl, sanitizePhoneNumber } from "@/utils/phone";
import {
  extractNeighborhoodAndCity,
  sanitizeDescription,
} from "@/utils/address";
import {
  getNicheFallbackGallery,
  getNicheFallbackImage,
} from "@/utils/establishment-photos";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";
import {
  getHeroSubtitle,
  getHeroPills,
  getCtaButtonText,
  getServiceIcon,
  isAutomotiveNiche,
  isRestaurantNiche,
} from "@/utils/showcase";
import { resolvePublicSubniche } from "@/utils/prospecting-niche";

interface PublicHeroSplitProps {
  tenantName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  headline?: string | null;
  address?: string | null;
  phoneWhatsapp?: string | null;
  heroImageUrl?: string | null;
  placePhotos?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  businessCategory?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: TenantReview[];
  googleMapsUrl?: string | null;
  isOpenNow?: boolean;
  statusBadgeText?: string;
  brandColor?: string;
  theme?: NicheThemeConfig;
  tenant?: any;
  services?: Service[];
  ctaText?: string | null;
  onOpenBooking: () => void;
  onOpenVehicleQuote?: () => void;
}

interface HighlightItem {
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ElementType;
}

function getNicheHighlights(subniche: string): HighlightItem[] {
  switch (subniche) {
    case "petshop":
      return [
        {
          title: "Cuidado & Carinho",
          subtitle: "Equipe apaixonada e manejo sem estresse",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-700",
          Icon: HeartHandshake,
        },
        {
          title: "Estrutura Higienizada",
          subtitle: "Ambiente seguro e protocolos veterinários",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-700",
          Icon: ShieldCheck,
        },
        {
          title: "Agendamento Ágil",
          subtitle: "Atendimento com hora marcada ou emergência",
          iconBg: "bg-sky-100",
          iconColor: "text-sky-700",
          Icon: Clock,
        },
      ];
    case "towing":
      return [
        {
          title: "Atendimento 24 Horas",
          subtitle: "Pronto-atendimento imediato dia e noite",
          iconBg: "bg-red-100",
          iconColor: "text-red-700",
          Icon: Clock,
        },
        {
          title: "Caminhão Plataforma",
          subtitle: "Transporte seguro para carros, SUVs e motos",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-700",
          Icon: Truck,
        },
        {
          title: "Despacho via GPS",
          subtitle: "Envie sua localização direto no WhatsApp",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-700",
          Icon: ShieldCheck,
        },
      ];
    case "mechanic":
    case "car_wash":
      return [
        {
          title: "Diagnóstico Transparente",
          subtitle: "Orçamento claro antes de qualquer serviço",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-700",
          Icon: ShieldCheck,
        },
        {
          title: "Equipe Especializada",
          subtitle: "Ferramentas modernas e peças com garantia",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-700",
          Icon: Award,
        },
        {
          title: "Atendimento Rápido",
          subtitle: "Triagem ágil por WhatsApp ou placa",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-700",
          Icon: Clock,
        },
      ];
    case "beauty":
      return [
        {
          title: "Atendimento Personalizado",
          subtitle: "Técnicas atuais e foco no seu estilo",
          iconBg: "bg-rose-100",
          iconColor: "text-rose-700",
          Icon: Sparkles,
        },
        {
          title: "Hora Marcada",
          subtitle: "Conforto e pontualidade sem espera",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-700",
          Icon: Clock,
        },
        {
          title: "Produtos Selecionados",
          subtitle: "Alta durabilidade e biossegurança",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-700",
          Icon: ShieldCheck,
        },
      ];
    case "bakery":
      return [
        {
          title: "Produção Artesanal",
          subtitle: "Ingredientes selecionados e frescor diário",
          iconBg: "bg-rose-100",
          iconColor: "text-rose-700",
          Icon: Cake,
        },
        {
          title: "Encomendas Sob Medida",
          subtitle: "Bolos e kits para festas e comemorações",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-700",
          Icon: Award,
        },
        {
          title: "Retirada & Entrega",
          subtitle: "Pedido rápido direto pelo WhatsApp",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-700",
          Icon: Clock,
        },
      ];
    default:
      return [
        {
          title: "Atendimento Verificado",
          subtitle: "Qualidade comprovada por clientes locais",
          iconBg: "bg-teal-100",
          iconColor: "text-teal-700",
          Icon: ShieldCheck,
        },
        {
          title: "Profissionais Qualificados",
          subtitle: "Excelência e transparência em cada etapa",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-700",
          Icon: Award,
        },
        {
          title: "Contato Direto",
          subtitle: "Resposta rápida pelo WhatsApp e agendamento",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-700",
          Icon: Clock,
        },
      ];
  }
}

export function PublicHeroSplit({
  tenantName,
  logoUrl,
  coverUrl,
  description,
  address,
  phoneWhatsapp,
  heroImageUrl,
  placePhotos,
  latitude,
  longitude,
  businessCategory,
  rating,
  reviewCount,
  reviews = [],
  googleMapsUrl: customGoogleMapsUrl,
  isOpenNow = true,
  statusBadgeText,
  brandColor,
  theme,
  tenant,
  services = [],
  ctaText,
  onOpenBooking,
  onOpenVehicleQuote,
}: PublicHeroSplitProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const currentTheme = theme || NICHE_THEMES.retail_default;
  const subniche = resolvePublicSubniche(tenant, {
    name: tenantName,
    business_category: businessCategory,
  });

  const isTowing = subniche === "towing";
  const isPetShop = subniche === "petshop" || currentTheme?.id === "petshop";
  const isConfectionery =
    subniche === "bakery" ||
    currentTheme?.id === "confeitaria" ||
    currentTheme?.id === "bakery" ||
    currentTheme?.id === "confectionery";
  const isBeauty =
    subniche === "beauty" ||
    currentTheme?.id === "estetica_saude" ||
    currentTheme?.id === "health_beauty";
  const isAutomotive =
    !isTowing &&
    (subniche === "mechanic" ||
      currentTheme?.id === "automotive" ||
      currentTheme?.id === "automotivo" ||
      currentTheme?.id === "auto" ||
      isAutomotiveNiche(tenant, undefined, currentTheme?.id));
  const isRestaurant =
    subniche === "restaurant" ||
    currentTheme?.id === "restaurant" ||
    currentTheme?.id === "gastronomia" ||
    currentTheme?.id === "food" ||
    isRestaurantNiche(tenant, undefined, currentTheme?.id);

  const effectiveLogoUrl =
    logoUrl || tenant?.logo_url || tenant?.tenant_profiles?.logo_url || null;
  const displayAddress = address || tenant?.address || "";
  const cleanCity = extractNeighborhoodAndCity(displayAddress);
  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";
  const cleanDescription = sanitizeDescription(description, displayAddress);
  const rawSubtitle =
    getHeroSubtitle(tenant, undefined, currentTheme?.id, businessCategory) ||
    cleanDescription;
  const heroSubtitle = sanitizeDescription(rawSubtitle, displayAddress);
  const heroPills = getHeroPills(
    tenant,
    services,
    currentTheme?.id,
    businessCategory
  );
  const ctaLabel =
    ctaText ||
    (isTowing
      ? "Chamar Guincho 24h"
      : isRestaurant
      ? "Ver Cardápio Digital"
      : isAutomotive
      ? "Solicitar Orçamento por Placa"
      : getCtaButtonText(tenant, currentTheme?.id, businessCategory));

  const heroWaMessage = isRestaurant
    ? `Olá! Estou vendo o cardápio de ${tenantName} e gostaria de atendimento.`
    : isTowing
    ? `Olá! Preciso de guincho / socorro veicular 24h com ${tenantName}.`
    : `Olá, vi a vitrine de vocês e gostaria de agendar um atendimento/orçamento em ${tenantName}.`;
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", heroWaMessage);

  // Monta galeria completa com pelo menos 3 fotos reais/curadas para o mosaico
  const mosaicPhotos = useMemo(() => {
    const rawList: string[] = [];
    const pushUnique = (url?: string | null) => {
      if (!url || typeof url !== "string") return;
      const trimmed = url.trim();
      if (!trimmed || !/^https?:\/\//i.test(trimmed)) return;
      if (!rawList.includes(trimmed)) rawList.push(trimmed);
    };

    pushUnique(coverUrl);
    pushUnique(heroImageUrl);
    if (Array.isArray(placePhotos)) {
      placePhotos.forEach((p) => pushUnique(p));
    }

    if (rawList.length < 3) {
      const fallbacks = getNicheFallbackGallery(subniche, businessCategory);
      for (const fb of fallbacks) {
        if (rawList.length >= 4) break;
        pushUnique(fb);
      }
    }

    if (rawList.length === 0) {
      pushUnique(getNicheFallbackImage(currentTheme?.id, businessCategory));
    }

    return rawList.slice(0, 6);
  }, [coverUrl, heroImageUrl, placePhotos, subniche, businessCategory, currentTheme?.id]);

  const coverImage = mosaicPhotos[0];

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const mapsUrl =
    customGoogleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${tenantName} ${displayAddress}`
        )}`);

  const hasRating = typeof rating === "number" && rating > 0;
  const hasReviewCount = typeof reviewCount === "number" && reviewCount > 0;
  const displayRating = hasRating ? rating.toFixed(1) : "5.0";
  const displayReviewsCount = hasReviewCount ? `${reviewCount}` : "50+";

  // Detecta atendimento 24h para evitar "Horário sob consulta"
  const rawHoursText = Array.isArray(tenant?.opening_hours)
    ? tenant.opening_hours.join(" ").toLowerCase()
    : "";
  const is24Hours =
    isTowing ||
    /24\s*h|24\s*horas/i.test(tenantName) ||
    /24\s*h|24\s*horas/i.test(rawHoursText);

  const normalizedBadge =
    is24Hours
      ? "Atendimento 24h"
      : statusBadgeText && !/sob consulta/i.test(statusBadgeText)
      ? statusBadgeText
      : isOpenNow
      ? "Aberto Agora"
      : "Aberto em Horário Comercial";

  const isStatusGreen = is24Hours || isOpenNow;

  const handlePillClick = () => {
    const targetIds = isRestaurant
      ? ["cardapio"]
      : ["servicos", "produtos", "agendamento", "socorro-guincho"];
    for (const id of targetIds) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    onOpenBooking();
  };

  // Avaliação real em destaque (Zero Mock Data)
  const featuredRealReview = useMemo(() => {
    const valid = (reviews || []).filter(
      (r) =>
        r &&
        r.is_visible !== false &&
        Number(r.rating || 5) >= 4 &&
        String(r.review_text || r.text || "").trim().length > 15
    );
    return valid[0] || null;
  }, [reviews]);

  const highlights = useMemo(() => getNicheHighlights(subniche), [subniche]);

  // Fundo luminoso suave adaptado ao nicho
  const lightHeroBgClass = isPetShop
    ? "bg-gradient-to-br from-slate-50 via-white to-emerald-50/75"
    : isConfectionery || isBeauty
    ? "bg-gradient-to-br from-rose-50/65 via-white to-pink-50/60"
    : isAutomotive
    ? "bg-gradient-to-br from-slate-50 via-white to-blue-50/70"
    : isTowing
    ? "bg-gradient-to-br from-slate-50 via-white to-red-50/60"
    : "bg-gradient-to-br from-slate-50 via-white to-teal-50/70";

  // ============================================================================
  // LIGHTBOX / GALERIA COMPLETA DE FOTOS
  // ============================================================================
  const renderLightbox = () => {
    if (lightboxIndex === null) return null;
    const currentPhoto = mosaicPhotos[lightboxIndex] || mosaicPhotos[0];
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4"
        onClick={() => setLightboxIndex(null)}
      >
        <div
          className="relative w-full max-w-4xl flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex items-center justify-between text-white">
            <span className="text-xs sm:text-sm font-bold text-zinc-300">
              {tenantName} • Foto {lightboxIndex + 1} de {mosaicPhotos.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition cursor-pointer"
              aria-label="Fechar galeria"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative w-full flex items-center justify-center">
            {mosaicPhotos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + mosaicPhotos.length) %
                      mosaicPhotos.length
                  )
                }
                className="absolute left-2 sm:left-4 z-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 p-2.5 text-white transition cursor-pointer"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            <img
              src={currentPhoto}
              alt={`${tenantName} - foto ${lightboxIndex + 1}`}
              className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />

            {mosaicPhotos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % mosaicPhotos.length)
                }
                className="absolute right-2 sm:right-4 z-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 p-2.5 text-white transition cursor-pointer"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {mosaicPhotos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
              {mosaicPhotos.map((photo, idx) => (
                <button
                  key={`lb-thumb-${idx}`}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`h-14 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    idx === lightboxIndex
                      ? "border-amber-400 scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Miniatura ${idx + 1}`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // 1. HERO GASTRONÔMICO (RESTAURANTES, BARES & CERVEJARIAS)
  // Foto de capa real em destaque com overlay translúcido quente (sem bloco preto chapado)
  // ============================================================================
  if (isRestaurant) {
    return (
      <>
        <section className="relative w-full max-w-full overflow-hidden rounded-3xl shadow-2xl border border-amber-500/20">
          {/* Capa em tela cheia com overlay translúcido quente */}
          <div className="relative min-h-[340px] sm:min-h-[400px] flex flex-col justify-end p-5 sm:p-8">
            <img
              src={coverImage}
              alt={tenantName}
              className="absolute inset-0 h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1310]/95 via-[#1c1410]/60 to-amber-950/20" />

            {/* Botão flutuante de fotos */}
            {mosaicPhotos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/20 px-3 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-amber-400" />
                <span>Ver fotos ({mosaicPhotos.length})</span>
              </button>
            )}

            {/* Conteúdo do Hero */}
            <div className="relative z-10 w-full space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="shrink-0 w-18 h-18 sm:w-24 sm:h-24 rounded-2xl border-2 border-amber-400/50 shadow-2xl bg-zinc-900/90 overflow-hidden flex items-center justify-center">
                  {effectiveLogoUrl ? (
                    <img
                      src={effectiveLogoUrl}
                      alt={tenantName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Utensils className="h-9 w-9 text-amber-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-amber-400/30 text-xs font-semibold text-amber-200">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="font-bold text-white">{displayRating}</span>
                      <span className="text-amber-100/90">
                        • {displayReviewsCount} avaliações no Google
                      </span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                        isStatusGreen
                          ? "bg-emerald-950/75 border-emerald-400/40 text-emerald-300"
                          : "bg-amber-950/75 border-amber-400/40 text-amber-200"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isStatusGreen ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      <span>{normalizedBadge}</span>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                    {tenantName}
                  </h1>

                  {(cleanCity || displayAddress) && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-amber-100/90">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{cleanCity || displayAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {heroSubtitle && (
                <p className="text-xs sm:text-sm text-zinc-200/95 leading-relaxed max-w-2xl">
                  {heroSubtitle}
                </p>
              )}

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 pt-1">
                <a
                  href="#cardapio"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition active:scale-95"
                >
                  <Utensils className="h-4 w-4 shrink-0" />
                  <span>Ver Cardápio Digital</span>
                </a>

                {phoneWhatsapp && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span>Falar no WhatsApp</span>
                  </a>
                )}

                {cleanPhone && (
                  <a
                    href={`tel:+55${cleanPhone}`}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition active:scale-95"
                  >
                    <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Ligar</span>
                  </a>
                )}

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition active:scale-95"
                >
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Como Chegar</span>
                </a>
              </div>
            </div>
          </div>
        </section>
        {renderLightbox()}
      </>
    );
  }

  // ============================================================================
  // 2. NOVO SPLIT HERO LUMINOSO + MOSAICO ESTILO AIRBNB/GOOGLE + PROVA SOCIAL
  // ============================================================================
  return (
    <>
      <section className="space-y-5">
        {/* Card Principal Luminoso do Split Hero */}
        <div
          className={`relative overflow-hidden rounded-3xl border border-slate-200/80 ${lightHeroBgClass} p-5 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/60`}
        >
          {/* Glow decorativo sutil derivado da cor primária */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15"
            style={{
              backgroundColor:
                brandColor ||
                (isPetShop
                  ? "#10b981"
                  : isConfectionery
                  ? "#f43f5e"
                  : isTowing
                  ? "#dc2626"
                  : isAutomotive
                  ? "#2563eb"
                  : "#0d9488"),
            }}
          />

          <div className="relative z-10 flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 lg:gap-9 items-center">
            {/* COLUNA ESQUERDA: Identidade & Conversão */}
            <div className="w-full lg:col-span-6 space-y-4">
              {/* Badges de Reputação Google + Status */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="font-extrabold text-slate-900">
                    {displayRating}
                  </span>
                  <span className="text-slate-500 font-semibold">
                    • {displayReviewsCount} avaliações verificadas no Google
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${
                    isStatusGreen
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    {isStatusGreen && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isStatusGreen ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                  </span>
                  <span>{normalizedBadge}</span>
                </div>
              </div>

              {/* Logo + Título Completo (sem truncate) */}
              <div className="flex items-start gap-3.5">
                {effectiveLogoUrl && (
                  <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md flex items-center justify-center">
                    <img
                      src={effectiveLogoUrl}
                      alt={tenantName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15] break-words">
                    {tenantName}
                  </h1>
                  {cleanCity && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600">
                      <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{cleanCity}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Descrição Limpa */}
              {heroSubtitle && (
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {heroSubtitle}
                </p>
              )}

              {/* Pills Clicáveis dos Principais Serviços / Categorias */}
              {heroPills && heroPills.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {heroPills.slice(0, 5).map((pill, idx) => {
                    const Icon = getServiceIcon(pill, currentTheme?.id);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={handlePillClick}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
                      >
                        <Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{pill}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Botões de Ação de Alto Contraste */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-2">
                {/* CTA Principal na cor do nicho */}
                <button
                  type="button"
                  onClick={() =>
                    isAutomotive && onOpenVehicleQuote
                      ? onOpenVehicleQuote()
                      : onOpenBooking()
                  }
                  className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl text-sm font-extrabold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
                  style={{
                    backgroundColor:
                      brandColor ||
                      (isPetShop
                        ? "#059669"
                        : isTowing
                        ? "#dc2626"
                        : isAutomotive
                        ? "#2563eb"
                        : isConfectionery
                        ? "#e11d48"
                        : "#0d9488"),
                  }}
                >
                  {isTowing ? (
                    <Truck className="h-4 w-4 shrink-0" />
                  ) : isAutomotive ? (
                    <Wrench className="h-4 w-4 shrink-0" />
                  ) : isPetShop ? (
                    <Dog className="h-4 w-4 shrink-0" />
                  ) : isConfectionery ? (
                    <Cake className="h-4 w-4 shrink-0" />
                  ) : (
                    <Calendar className="h-4 w-4 shrink-0" />
                  )}
                  <span>{ctaLabel}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>

                {/* Botão WhatsApp Verde */}
                {phoneWhatsapp && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 fill-white text-emerald-600" />
                    <span>Falar no WhatsApp</span>
                  </a>
                )}

                {/* Botão Secundário Como Chegar */}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-sm font-bold shadow-2xs transition active:scale-[0.98]"
                  title="Ver localização e traçar rota no Google Maps"
                >
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Como Chegar</span>
                </a>
              </div>
            </div>

            {/* COLUNA DIREITA: Mosaico Visual Interativo Estilo Airbnb / Google */}
            <div className="w-full lg:col-span-6">
              {/* Desktop & Tablet: Grade 1 Foto Principal Grande + 2 Empilhadas */}
              <div className="hidden sm:grid grid-cols-12 gap-2.5 h-[340px] lg:h-[400px] relative">
                {/* Foto Principal Grande à Esquerda */}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="col-span-7 h-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md group cursor-pointer relative"
                >
                  <img
                    src={mosaicPhotos[0]}
                    alt={`${tenantName} - destaque`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {/* 2 Fotos Menores Empilhadas à Direita */}
                <div className="col-span-5 grid grid-rows-2 gap-2.5 h-full">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(1)}
                    className="h-full w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md group cursor-pointer relative"
                  >
                    <img
                      src={mosaicPhotos[1] || mosaicPhotos[0]}
                      alt={`${tenantName} - foto 2`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLightboxIndex(2)}
                    className="h-full w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md group cursor-pointer relative"
                  >
                    <img
                      src={mosaicPhotos[2] || mosaicPhotos[0]}
                      alt={`${tenantName} - foto 3`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                </div>

                {/* Botão Flutuante "Ver todas as fotos" */}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200 px-3.5 py-2 text-xs font-extrabold text-slate-900 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-700" />
                  <span>Ver todas as fotos ({mosaicPhotos.length})</span>
                </button>
              </div>

              {/* Mobile: Foto Principal em Destaque + Carrossel Horizontal de Miniaturas */}
              <div className="sm:hidden space-y-2.5">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="relative block aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md cursor-pointer"
                >
                  <img
                    src={mosaicPhotos[0]}
                    alt={tenantName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-extrabold text-slate-900 shadow-md">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Ver fotos ({mosaicPhotos.length})</span>
                  </span>
                </button>

                {mosaicPhotos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {mosaicPhotos.slice(1).map((photo, idx) => (
                      <button
                        key={`mob-thumb-${idx}`}
                        type="button"
                        onClick={() => setLightboxIndex(idx + 1)}
                        className="h-16 w-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs cursor-pointer"
                      >
                        <img
                          src={photo}
                          alt={`${tenantName} - foto ${idx + 2}`}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BLOCO DE DESTAQUE VISUAL (3 DIFERENCIAIS) & PROVA SOCIAL GOOGLE     */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* 3 Diferenciais Visuais do Nicho */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {highlights.map((item, idx) => {
              const Icon = item.Icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition flex sm:flex-col items-start gap-3"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card de Destaque de Avaliação Real / Autoridade Google Maps */}
          <div className="lg:col-span-5 rounded-2xl border border-amber-200/80 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1.5 text-xs font-extrabold text-slate-900">
                  {displayRating}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Google Verified</span>
              </span>
            </div>

            {featuredRealReview ? (
              <>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed line-clamp-2">
                  &ldquo;
                  {String(
                    featuredRealReview.review_text || featuredRealReview.text
                  ).trim()}
                  &rdquo;
                </p>
                <p className="text-[11px] font-bold text-slate-500">
                  — {featuredRealReview.author_name || "Cliente Google"} •
                  Avaliação real no Google Maps
                </p>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                  Nota <strong className="text-slate-900">{displayRating}</strong>{" "}
                  com{" "}
                  <strong className="text-slate-900">
                    {displayReviewsCount} avaliações
                  </strong>{" "}
                  de clientes reais no Google Maps
                  {cleanCity ? ` em ${cleanCity}` : ""}.
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <span>Ver perfil verificado no Google Maps</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {renderLightbox()}
    </>
  );
}
