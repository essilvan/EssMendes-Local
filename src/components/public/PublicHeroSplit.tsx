"use client";

import React from "react";
import {
  Calendar,
  MessageCircle,
  Navigation,
  ArrowRight,
} from "lucide-react";
import type { TenantReview } from "@/types";
import { generateWhatsAppUrl } from "@/utils/phone";
import { sanitizeDescription } from "@/utils/address";
import { getNicheFallbackImage } from "@/utils/establishment-photos";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PublicHeroSplitProps {
  tenantName: string;
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
  theme?: NicheThemeConfig;
  onOpenBooking: () => void;
}

export function PublicHeroSplit({
  tenantName,
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
  theme,
  onOpenBooking,
}: PublicHeroSplitProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;
  const displayAddress = address || "Atendimento Presencial com Estacionamento";
  const cleanDescription = sanitizeDescription(description, address);
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", tenantName);

  const fallbackImage = getNicheFallbackImage(currentTheme?.id, businessCategory);
  const heroImage =
    heroImageUrl ||
    (placePhotos && placePhotos.length > 0 ? placePhotos[0] : null) ||
    fallbackImage;

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(displayAddress)}`;

  const hasRating = typeof rating === "number" && rating > 0;
  const hasReviewCount = typeof reviewCount === "number" && reviewCount > 0;
  const displayRating = hasRating ? rating.toFixed(1) : "4.9";
  const displayReviewsCount = hasReviewCount ? `${reviewCount}` : "50+";

  return (
    <section className="relative overflow-hidden rounded-3xl min-h-[520px] md:min-h-[620px] flex items-center p-7 sm:p-12 lg:p-16 border border-white/10 shadow-2xl">
      {/* 1. FOTO TOTALMENTE ILUMINADA E SEM MÁSCARA ESCURA */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img 
          src={heroImage} 
          alt={tenantName} 
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        {/* Apenas um gradiente muito suave e transparente no canto esquerdo para garantir leitura do texto branco, deixando 80% da foto na claridade original */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
      </div>

      {/* 2. ESTRUTURA DOS TEXTOS (IGUAL À REFERÊNCIA) */}
      <div className="relative z-10 max-w-2xl text-left space-y-4">
        {/* Subtítulo superior pequeno (uppercase/suave) */}
        <p className="text-sm font-medium text-white/90 drop-shadow mb-2">
          Serviço Especializado de Confiança
        </p>

        {/* Título principal grande e imponente (branco, negrito, estilo da foto) */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] max-w-2xl leading-tight">
          {tenantName}
        </h1>

        {/* Prova social logo abaixo do título (estrelas + avaliações) */}
        <div className="flex items-center gap-2 mt-4 text-white drop-shadow">
          <span className="text-amber-400 font-bold text-lg">★★★★★</span>
          <span className="font-semibold text-base">
            {displayRating} ({displayReviewsCount} Avaliações no Google)
          </span>
        </div>

        {/* Parágrafo de descrição */}
        <p className="mt-4 text-white/95 text-base md:text-lg max-w-xl leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          {cleanDescription || "Especialistas com atendimento de excelência e compromisso com sua satisfação."}
        </p>

        {/* Botões de ação alinhados à esquerda abaixo da descrição */}
        <div className="flex flex-wrap items-center gap-3.5 pt-4">
          {/* Botão primário (Agendar / WhatsApp) */}
          <button
            type="button"
            onClick={onOpenBooking}
            className={`inline-flex items-center justify-center gap-2.5 rounded-2xl ${currentTheme.ctaButtonClass} px-7 py-4 text-sm font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
          >
            <Calendar className="h-4 w-4" />
            <span>Agendar Horário Online</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Botão secundário (Conversar no WhatsApp) */}
          {phoneWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-black/40 hover:bg-black/60 backdrop-blur-md px-6 sm:px-7 py-4 text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400 fill-current" />
              <span>Conversar no WhatsApp</span>
            </a>
          )}

          {/* Botão secundário de rota (GPS / Como Chegar) */}
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/15 hover:bg-white/25 backdrop-blur-md px-5 py-4 text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md"
            title="Traçar rota no GPS"
          >
            <Navigation className="h-4 w-4 text-cyan-300" />
            <span>Como Chegar</span>
          </a>
        </div>
      </div>
    </section>
  );
}
