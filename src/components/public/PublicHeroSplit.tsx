"use client";

import React from "react";
import {
  Calendar,
  Phone,
  MessageCircle,
  MapPin,
  ArrowRight,
  Star,
  Dog,
  Cat,
  Bone,
  PawPrint,
  Cake,
  Cookie,
  Cherry,
  Sparkles,
  CarFront,
  Wrench,
  Utensils,
} from "lucide-react";
import type { TenantReview, Service } from "@/types";
import { generateWhatsAppUrl, sanitizePhoneNumber } from "@/utils/phone";
import { sanitizeDescription } from "@/utils/address";
import { getNicheFallbackImage } from "@/utils/establishment-photos";
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

export function PublicHeroSplit({
  tenantName,
  logoUrl,
  coverUrl,
  description,
  headline,
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
  const currentTheme = theme || NICHE_THEMES.retail_default;
  const isPetShop = currentTheme?.id === "petshop";
  const isConfectionery = currentTheme?.id === "confeitaria" || currentTheme?.id === "bakery" || currentTheme?.id === "confectionery";
  const isAutomotive =
    currentTheme?.id === "automotive" ||
    currentTheme?.id === "automotivo" ||
    currentTheme?.id === "auto" ||
    isAutomotiveNiche(tenant, undefined, currentTheme?.id);
  const isRestaurant =
    currentTheme?.id === "restaurant" ||
    currentTheme?.id === "gastronomia" ||
    currentTheme?.id === "food" ||
    isRestaurantNiche(tenant, undefined, currentTheme?.id);
  const effectiveLogoUrl =
    logoUrl || tenant?.logo_url || tenant?.tenant_profiles?.logo_url || null;
  const displayAddress = address || tenant?.address || "Atendimento Presencial";
  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";
  const cleanDescription = sanitizeDescription(description, address);
  const heroSubtitle =
    getHeroSubtitle(tenant, undefined, currentTheme?.id, businessCategory) || cleanDescription;
  const heroPills = getHeroPills(tenant, services, currentTheme?.id, businessCategory);
  const ctaLabel = ctaText || getCtaButtonText(tenant, currentTheme?.id, businessCategory);
  const heroWaMessage = isRestaurant
    ? `Olá! Estou vendo o cardápio de ${tenantName} e gostaria de atendimento.`
    : `Olá, vi a vitrine de vocês e gostaria de agendar um atendimento/orçamento em ${tenantName}.`;
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", heroWaMessage);

  const fallbackImage = getNicheFallbackImage(currentTheme?.id, businessCategory);
  const coverImage =
    coverUrl ||
    heroImageUrl ||
    (placePhotos && placePhotos.length > 0 ? placePhotos[0] : null) ||
    fallbackImage;

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
  const displayRating = hasRating ? rating.toFixed(1) : "4.9";
  const displayReviewsCount = hasReviewCount ? `${reviewCount}` : "50+";

  const isOpen = isOpenNow;

  return (
    <section className="relative overflow-hidden rounded-3xl min-h-[460px] md:min-h-[540px] flex items-end p-4 sm:p-8 lg:p-10 border border-white/10 shadow-2xl group">
      {/* 1. Imagem de Capa com sobreposição escura (bg-black/60) */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img
          src={coverImage}
          alt={tenantName}
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out group-hover:scale-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/60 bg-gradient-to-t from-zinc-950 via-zinc-950/65 to-black/40" />
      </div>

      {/* Brilho ambiente dinâmico sutil no fundo */}
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-72 w-72 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: brandColor || (isConfectionery ? "#f43f5e" : isPetShop ? "#ea580c" : isRestaurant ? "#f59e0b" : isAutomotive ? "#2563eb" : "var(--brand-primary, #0d9488)") }}
      />

      {/* 2. Cartão de Alta Densidade com Efeito Glassmorphism Nobre */}
      <div className="relative z-10 w-full max-w-4xl backdrop-blur-2xl bg-zinc-950/85 border border-zinc-800/80 rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-white before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Logótipo / avatar circular com anel metálico e sombra de profundidade */}
          <div className="relative h-18 w-18 sm:h-22 sm:w-22 shrink-0 rounded-2xl sm:rounded-3xl border-2 border-white/80 ring-4 ring-black/40 overflow-hidden shadow-2xl bg-zinc-900 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {effectiveLogoUrl ? (
              <img
                src={effectiveLogoUrl}
                alt={tenantName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : isPetShop ? (
              <Dog className="h-10 w-10 text-amber-400 animate-tail-wag" />
            ) : isConfectionery ? (
              <Cake className="h-10 w-10 text-rose-400 animate-sweet-float" />
            ) : isAutomotive ? (
              <CarFront className="h-10 w-10 text-blue-400" />
            ) : isRestaurant ? (
              <Utensils className="h-10 w-10 text-amber-400 animate-culinary-float" />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-white uppercase select-none">
                {tenantName.charAt(0)}
              </span>
            )}
          </div>

          {/* Textos, Nome do Negócio e Badges */}
          <div className="space-y-2 flex-1 min-w-0">
            <h1 className="tracking-tight font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white drop-shadow-md truncate">
              {tenantName}
            </h1>

            {/* Sinais de Confiança: Nota média com estrelas douradas, status de horário e endereço */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 pb-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-xs transition-colors">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="font-bold text-white">{displayRating}</span>
                <span className="text-zinc-300">({displayReviewsCount} avaliações)</span>
                <span className="text-zinc-400 font-medium">• Google</span>
              </div>

              {/* Indicador visual dinâmico com ponto pulsante verde suave: "Aberto Agora" */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs transition-all ${
                  isOpen
                    ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-950/70 border-amber-500/30 text-amber-400"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {isOpen && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isOpen ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400"
                    }`}
                  />
                </span>
                <span>{statusBadgeText || (isOpen ? "Aberto Agora" : "Fechado no momento")}</span>
              </div>

              {/* Badge exclusivo do nicho Pet Shop */}
              {isPetShop && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-xs font-bold text-amber-200 backdrop-blur-md shadow-xs">
                  <Dog className="h-3.5 w-3.5 text-amber-300 animate-tail-wag" />
                  <span>Pet Shop & Bem-Estar</span>
                </div>
              )}

              {/* Badge exclusivo do nicho Confeitaria & Bolos */}
              {isConfectionery && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-400/40 text-xs font-bold text-rose-200 backdrop-blur-md shadow-xs">
                  <Cake className="h-3.5 w-3.5 text-rose-300 animate-sweet-float" />
                  <span>Confeitaria & Bolos Artesanais</span>
                </div>
              )}

              {businessCategory && !isPetShop && (
                <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-zinc-200 backdrop-blur-md">
                  {businessCategory}
                </span>
              )}
            </div>

            {/* Endereço do Estabelecimento no Hero */}
            {displayAddress && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-300">
                <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{displayAddress}</span>
              </div>
            )}

            {heroSubtitle && (
              <p className="text-xs sm:text-sm text-zinc-200/95 line-clamp-2 leading-relaxed drop-shadow-xs">
                {heroSubtitle}
              </p>
            )}

            {/* Pills / Diferenciais Dinâmicos (Supabase) */}
            {heroPills && heroPills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {heroPills.map((pill, idx) => {
                  const Icon = getServiceIcon(pill, currentTheme?.id);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 border border-white/20 px-2.5 py-1 text-[11px] font-bold text-zinc-100 backdrop-blur-md shadow-2xs"
                    >
                      <Icon className="h-3.5 w-3.5 text-amber-300" />
                      <span>{pill}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Divisória subtil com gradiente */}
        <div className="my-5 border-t border-white/15" />

        {/* Botões de Ação Rápida Horizontais Alinhados */}
        {isRestaurant ? (
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-4 mt-6">
            {/* 1. Ver Cardápio */}
            <a
              href="#cardapio"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 whitespace-nowrap text-sm sm:text-base transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Utensils className="h-4 w-4 shrink-0 text-zinc-950" />
              <span>Ver Cardápio</span>
            </a>

            {/* 2. WhatsApp */}
            {phoneWhatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm sm:text-base transition-all duration-200 active:scale-95"
              >
                <MessageCircle className="h-4 w-4 shrink-0 fill-white text-emerald-600" />
                <span>Chamar Garçom / WhatsApp</span>
              </a>
            )}

            {/* 3. Ligar */}
            {cleanPhone && (
              <a
                href={`tel:+55${cleanPhone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 backdrop-blur-sm whitespace-nowrap font-medium text-sm sm:text-base transition-all duration-200 active:scale-95"
              >
                <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Ligar</span>
              </a>
            )}

            {/* 4. Como Chegar */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 backdrop-blur-sm whitespace-nowrap font-medium text-sm sm:text-base transition-all duration-200 active:scale-95"
              title="Ver localização e traçar rota no Maps"
            >
              <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Como Chegar</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-4 mt-6">
            {/* CTA Primário: Orçamento por Placa (Nicho Automotivo) */}
            {isAutomotive && onOpenVehicleQuote && (
              <button
                type="button"
                onClick={onOpenVehicleQuote}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 whitespace-nowrap font-medium text-sm sm:text-base transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Wrench className="h-4 w-4 shrink-0 text-white" />
                <span>Solicitar Orçamento por Placa</span>
              </button>
            )}

            {/* Botão WhatsApp Direto com feedback tátil e sombra suave */}
            {phoneWhatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 whitespace-nowrap font-medium text-sm sm:text-base transition-all duration-200 active:scale-95"
              >
                <MessageCircle className="h-4 w-4 shrink-0 fill-white text-emerald-600" />
                <span>Falar no WhatsApp</span>
              </a>
            )}

            {/* Botão Localização (abre rota no Maps) */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 backdrop-blur-sm whitespace-nowrap font-medium text-sm sm:text-base transition-all duration-200 active:scale-95"
              title="Ver localização e traçar rota no Maps"
            >
              <MapPin className="h-4 w-4 text-cyan-300 shrink-0" />
              <span>Localização</span>
            </a>

            {/* CTA de Agendamento Online (quando não automotivo) */}
            {(!isAutomotive || !onOpenVehicleQuote) && (
              <button
                type="button"
                onClick={onOpenBooking}
                className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-6 rounded-xl whitespace-nowrap font-medium text-sm sm:text-base text-white shadow-xl transition-all duration-200 active:scale-95 cursor-pointer animate-shimmer"
                style={{
                  backgroundColor: brandColor || "var(--brand-primary, #0d9488)",
                  boxShadow: `0 10px 25px -5px ${brandColor ? `${brandColor}66` : "rgba(13,148,136,0.4)"}`,
                }}
              >
                {isConfectionery ? (
                  <Cake className="h-4 w-4 shrink-0 text-rose-200 animate-sweet-float" />
                ) : isPetShop ? (
                  <Dog className="h-4 w-4 shrink-0 text-amber-200 animate-tail-wag" />
                ) : isAutomotive ? (
                  <Wrench className="h-4 w-4 shrink-0 text-blue-200 animate-wrench-tilt" />
                ) : (
                  <Calendar className="h-4 w-4 shrink-0" />
                )}
                <span>{ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
