"use client";

import React, { useState } from "react";
import type {
  Service,
  TenantProfile,
  PortfolioItem,
  TenantReview,
  TenantPost,
  TenantProduct,
} from "@/types";
import { getThemeColorStyles, getContrastTextColor } from "@/utils/color";
import { getTenantTheme, NICHE_THEMES } from "@/config/tenant-themes";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { MobileStickyBar } from "./MobileStickyBar";
import { PublicBookingFlow } from "./PublicBookingFlow";
import { PublicPageTracker } from "./PublicPageTracker";
import { ConversionTemplateView } from "./templates/ConversionTemplateView";
import { MinimalTemplateView } from "./templates/MinimalTemplateView";
import { ModernTemplateView } from "./templates/ModernTemplateView";
import { PremiumTemplateView } from "./templates/PremiumTemplateView";
import type { BusinessAttributes as BusinessAttributesType } from "@/types";

interface PublicTenantHubProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    category?: string | null;
    google_types?: string[] | null;
    theme_niche?: string | null;
    theme_settings?: {
      template_id?: string;
      template?: string;
      niche?: string;
      primary_color?: string;
      [key: string]: any;
    } | null;
    google_rating?: number | null;
    google_reviews_count?: number | null;
    opening_hours?: string[] | null;
    business_attributes?: BusinessAttributesType | null;
  };
  profile: TenantProfile | null;
  services: Service[];
  portfolioItems: PortfolioItem[];
  reviews?: TenantReview[];
  posts?: TenantPost[];
  products?: TenantProduct[];
  isOpenNow: boolean;
  statusBadgeText?: string;
  statusDetailText?: string;
}

export function getThemeClasses(themeNiche: string | null | undefined) {
  switch (themeNiche) {
    case "automotivo":
    case "auto":
      return {
        root: "bg-zinc-950 text-zinc-100 dark",
        card: "bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-xl shadow-black/50",
        textMuted: "text-zinc-400",
        accentText: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        button: "bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold",
        heroTagline: "Serviço de Confiança e Agilidade Mecânica",
      };
    case "estetica_saude":
    case "health_beauty":
      return {
        root: "bg-slate-50 text-slate-800",
        card: "bg-white/95 border-slate-200 text-slate-800 shadow-md",
        textMuted: "text-slate-500",
        accentText: "text-teal-700",
        badge: "bg-teal-50 text-teal-800 border-teal-200",
        button: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold",
        heroTagline: "Cuidado Especializado & Bem-Estar",
      };
    case "gastronomia":
    case "food":
      return {
        root: "bg-stone-950 text-stone-100 dark",
        card: "bg-stone-900 border-stone-800 text-stone-100 shadow-xl",
        textMuted: "text-stone-400",
        accentText: "text-red-500",
        badge: "bg-red-950/60 text-red-400 border-red-800/40",
        button: "bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold",
        heroTagline: "Sabor Incomparável & Pedido Rápido",
      };
    case "barbearia":
      return {
        root: "bg-stone-950 text-stone-100 dark",
        card: "bg-stone-900 border-stone-800 text-stone-100 shadow-xl",
        textMuted: "text-stone-400",
        accentText: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        button: "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold",
        heroTagline: "Corte Tradicional, Estilo & Atendimento de Primeira",
      };
    case "servicos":
    case "retail_default":
    default:
      return {
        root: "bg-white text-gray-900",
        card: "bg-white border-gray-200 text-gray-900 shadow-sm",
        textMuted: "text-gray-500",
        accentText: "text-blue-600",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        button: "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
        heroTagline: "Qualidade, Variedade e Atendimento Direto",
      };
  }
}

export function PublicTenantHub({
  tenant,
  profile,
  services,
  portfolioItems,
  reviews = [],
  posts = [],
  products = [],
  isOpenNow,
  statusBadgeText,
  statusDetailText,
}: PublicTenantHubProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  const activeTemplate =
    (tenant.theme_settings?.template_id as
      | "conversion"
      | "minimal"
      | "modern"
      | "premium") ||
    (profile?.template_id as any) ||
    "premium";
  const brandColor =
    tenant.theme_settings?.primary_color || profile?.primary_color || "#e11d48";
  const colorStyles = getThemeColorStyles(brandColor);
  const effectiveNiche =
    tenant.theme_settings?.niche || tenant.theme_niche || profile?.template_id;

  const templateClasses: Record<string, string> = {
    premium: "template-premium font-serif-headings",
    modern: "template-modern bento-layout",
    minimal: "template-minimal font-mono-accents",
    conversion: "template-conversion cta-high-contrast",
  };
  const selectedTemplateClass =
    templateClasses[activeTemplate] || templateClasses.premium;

  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? reviews.length;

  const handleOpenBooking = (serviceId?: string) => {
    setSelectedServiceId(
      serviceId || (services.length > 0 ? services[0].id : null)
    );
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedServiceId(null);
  };

  const isAuto = effectiveNiche === "auto" || effectiveNiche === "automotivo" || effectiveNiche === "barbearia";
  const isFood = effectiveNiche === "food" || effectiveNiche === "gastronomia";
  const isHealth = effectiveNiche === "health_beauty" || effectiveNiche === "estetica_saude";

  const currentTheme = getTenantTheme(
    effectiveNiche,
    tenant.category || profile?.business_category,
    tenant.google_types || []
  );

  return (
    <div
      style={{ ...colorStyles, "--brand-primary": brandColor } as React.CSSProperties}
      className={`min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-200 ${selectedTemplateClass} ${
        activeTemplate === "minimal"
          ? "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
          : isAuto
          ? "bg-zinc-950 text-zinc-100"
          : isFood
          ? "bg-stone-950 text-stone-100"
          : isHealth
          ? "bg-slate-50 text-slate-900"
          : "bg-neutral-50/50 text-neutral-900"
      } selection:bg-neutral-900 selection:text-white`}
    >
      {/* Tracker de Analytics (Zero PII) */}
      <PublicPageTracker tenantId={tenant.id} />

      {/* 1. Header Dinâmico (Minimalista no 'minimal' ou Completo nos demais) */}
      {activeTemplate !== "minimal" ? (
        <PublicHeader
          tenantName={tenant.name}
          tenantSlug={tenant.slug}
          logoUrl={profile?.logo_url}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          address={profile?.address}
          latitude={profile?.latitude}
          longitude={profile?.longitude}
          openingHours={tenant.opening_hours || profile?.opening_hours_json}
          isOpenNow={isOpenNow}
          statusBadgeText={statusBadgeText}
          statusDetailText={statusDetailText}
          theme={currentTheme}
          onOpenBooking={() => handleOpenBooking()}
        />
      ) : (
        <nav className="w-full border-b border-neutral-200/80 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.logo_url && (
                <img
                  src={profile.logo_url}
                  alt={tenant.name}
                  className="h-8 w-8 rounded-xl object-contain border border-neutral-200/60 dark:border-white/10"
                />
              )}
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-white font-mono uppercase">
                {tenant.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenBooking()}
              className="text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
              style={{ backgroundColor: brandColor, color: getContrastTextColor(brandColor) }}
            >
              Agendar Horário
            </button>
          </div>
        </nav>
      )}

      {/* Container Centralizado com Conteúdo Real Dinâmico por Template */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16">
        {activeTemplate === "conversion" && (
          <ConversionTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            portfolioItems={portfolioItems}
            reviews={reviews}
            posts={posts}
            products={products}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {activeTemplate === "minimal" && (
          <MinimalTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            portfolioItems={portfolioItems}
            reviews={reviews}
            posts={posts}
            products={products}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {activeTemplate === "modern" && (
          <ModernTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            portfolioItems={portfolioItems}
            reviews={reviews}
            posts={posts}
            products={products}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {(activeTemplate === "premium" ||
          (activeTemplate !== "conversion" &&
            activeTemplate !== "minimal" &&
            activeTemplate !== "modern")) && (
          <PremiumTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            portfolioItems={portfolioItems}
            reviews={reviews}
            posts={posts}
            products={products}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            onOpenBooking={handleOpenBooking}
          />
        )}
      </main>

      {/* Footer padrão para templates ricos (minimal possui seu footer dedicado) */}
      {activeTemplate !== "minimal" && (
        <PublicFooter
          tenantName={tenant.name}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          address={profile?.address}
          latitude={profile?.latitude}
          longitude={profile?.longitude}
          openingHours={tenant.opening_hours || profile?.opening_hours_json}
          isOpenNow={isOpenNow}
          statusBadgeText={statusBadgeText}
          statusDetailText={statusDetailText}
          googleMapsUrl={profile?.google_maps_url}
          onOpenBooking={() => handleOpenBooking()}
        />
      )}

      {/* 11. Barra Fixa Mobile com inteligência por template */}
      <MobileStickyBar
        tenantId={tenant.id}
        tenantName={tenant.name}
        phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
        address={profile?.address}
        latitude={profile?.latitude}
        longitude={profile?.longitude}
        googleMapsUrl={profile?.google_maps_url}
        isOpenNow={isOpenNow}
        statusBadgeText={statusBadgeText}
        statusDetailText={statusDetailText}
        openingHours={tenant.opening_hours || profile?.opening_hours_json}
        theme={currentTheme}
        activeTemplate={activeTemplate}
        brandColor={brandColor}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Modal / Drawer Global de Agendamento em 3 Passos */}
      <PublicBookingFlow
        tenantId={tenant.id}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        businessPhone={profile?.phone_whatsapp}
        businessAddress={profile?.address}
        services={services}
        selectedServiceId={selectedServiceId}
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
      />
    </div>
  );
}
