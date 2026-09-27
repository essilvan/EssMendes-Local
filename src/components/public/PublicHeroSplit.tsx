"use client";

import React from "react";
import {
  Calendar,
  MessageCircle,
  MapPin,
  ArrowRight,
  Star,
} from "lucide-react";
import type { TenantReview } from "@/types";
import { generateWhatsAppUrl } from "@/utils/phone";
import { sanitizeDescription } from "@/utils/address";
import { getNicheFallbackImage } from "@/utils/establishment-photos";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PublicHeroSplitProps {
  tenantName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
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
  onOpenBooking: () => void;
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
  onOpenBooking,
}: PublicHeroSplitProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;
  const displayAddress = address || "Atendimento Presencial";
  const cleanDescription = sanitizeDescription(description, address);
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", tenantName);

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
    <section className="relative overflow-hidden rounded-3xl min-h-[440px] md:min-h-[520px] flex items-end p-4 sm:p-8 lg:p-10 border border-white/10 shadow-2xl">
      {/* 1. Imagem de Capa com sobreposição de gradiente escuro suave */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img
          src={coverImage}
          alt={tenantName}
          className="w-full h-full object-cover object-center scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* 2. Cartão com Efeito Glassmorphism */}
      <div className="relative z-10 w-full max-w-4xl backdrop-blur-md bg-white/10 dark:bg-black/30 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          {/* Logótipo / avatar circular do tenant com contorno reforçado */}
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-full border-2 border-white/80 ring-4 ring-black/30 overflow-hidden shadow-xl bg-neutral-900 flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenantName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-white uppercase select-none">
                {tenantName.charAt(0)}
              </span>
            )}
          </div>

          {/* Textos, Nome do Negócio e Badges */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="font-extrabold text-xl md:text-2xl tracking-tight text-white drop-shadow-md truncate">
              {tenantName}
            </h1>

            {cleanDescription && (
              <p className="text-xs sm:text-sm text-white/90 line-clamp-2 leading-relaxed drop-shadow-xs">
                {cleanDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Distintivo visual do Google */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/20 text-xs font-semibold text-amber-300 backdrop-blur-sm shadow-xs">
                <span className="text-amber-400">⭐</span>
                <span>{displayRating}</span>
                <span className="text-white/70">({displayReviewsCount})</span>
                <span className="text-white/60">• Google</span>
              </div>

              {/* Indicador visual dinâmico com ponto verde: "Aberto Agora" */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/20 text-xs font-semibold backdrop-blur-sm shadow-xs ${
                  isOpen ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isOpen && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isOpen ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                </span>
                <span>{statusBadgeText || (isOpen ? "Aberto Agora" : "Fechado no momento")}</span>
              </div>

              {businessCategory && (
                <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/90">
                  {businessCategory}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divisória subtil */}
        <div className="my-4 border-t border-white/15" />

        {/* Botões de contacto rápido lado a lado e CTA de Agendamento */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Botão Localização (abre rota no Maps) */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 hover:bg-white/25 backdrop-blur-md px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-md active:scale-95"
            title="Ver localização e traçar rota no Maps"
          >
            <MapPin className="h-4 w-4 text-cyan-300 shrink-0" />
            <span>Localização</span>
          </a>

          {/* Botão WhatsApp Direto */}
          {phoneWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>WhatsApp Direto</span>
            </a>
          )}

          {/* Botão Agendar Horário Online */}
          <button
            type="button"
            onClick={onOpenBooking}
            className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
            style={{
              backgroundColor: brandColor || "var(--brand-primary, #0d9488)",
            }}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Agendar Horário Online</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
