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
import { getThemeColorStyles } from "@/utils/color";
import { getTenantTheme, NICHE_THEMES } from "@/config/tenant-themes";
import { PublicHeader } from "./PublicHeader";
import { PublicHeroSplit } from "./PublicHeroSplit";
import { TrustMetricsBar } from "./TrustMetricsBar";
import { ConversionDashboard } from "./ConversionDashboard";
import { PublicProductsSection } from "./PublicProductsSection";
import { AboutBusinessSection } from "./AboutBusinessSection";
import { PlacePhotoGallery } from "./PlacePhotoGallery";
import { GoogleReviewsCard } from "./GoogleReviewsCard";
import { PublicPostsSection } from "./PublicPostsSection";
import { MapLocationCard } from "./MapLocationCard";
import { PublicFooter } from "./PublicFooter";
import { MobileStickyBar } from "./MobileStickyBar";
import { PublicBookingFlow } from "./PublicBookingFlow";
import { PublicPageTracker } from "./PublicPageTracker";

interface PublicTenantHubProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    category?: string | null;
    google_types?: string[] | null;
    theme_niche?: string | null;
    google_rating?: number | null;
    google_reviews_count?: number | null;
    opening_hours?: string[] | null;
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

  const primaryColor = profile?.primary_color || "#0d9488";
  const colorStyles = getThemeColorStyles(primaryColor);

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

  const themeStyles = getThemeClasses(
    tenant.theme_niche || (profile?.template_id && profile.template_id !== "default" ? profile.template_id : null)
  );

  const currentTheme = getTenantTheme(
    tenant.theme_niche || (profile?.template_id && profile.template_id !== "default" ? profile.template_id : null),
    tenant.category || profile?.business_category,
    tenant.google_types || []
  );

  return (
    <div
      style={colorStyles}
      className={`min-h-screen w-full transition-colors duration-300 ${themeStyles.root} selection:bg-slate-900 selection:text-white`}
    >
      {/* Tracker de Analytics (Zero PII) */}
      <PublicPageTracker tenantId={tenant.id} />

      {/* 1. Top Bar Utilitária Escura + Navbar Suspensa */}
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

      {/* Container Centralizado com Conteúdo Real */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* 2. Hero Section Universal Split Screen (Padrão Applewood) */}
        <PublicHeroSplit
          tenantName={tenant.name}
          description={profile?.description}
          address={profile?.address}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          heroImageUrl={profile?.hero_image_url || profile?.logo_url}
          placePhotos={profile?.place_photos}
          latitude={profile?.latitude}
          longitude={profile?.longitude}
          businessCategory={profile?.business_category}
          rating={realRating}
          reviewCount={realReviewCount}
          reviews={reviews}
          googleMapsUrl={profile?.google_maps_url}
          theme={currentTheme}
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* 3. Faixa de Pilares de Confiança Universal (4 Blocos) */}
        <TrustMetricsBar
          rating={realRating}
          reviewCount={realReviewCount}
          businessCategory={profile?.business_category}
          theme={currentTheme}
        />

        {/* 4. Dashboard de Conversão (Catálogo de Serviços + Antes & Depois / Promo + Widget de Agendamento) */}
        <ConversionDashboard
          tenant={tenant}
          profile={profile}
          services={services}
          portfolioItems={portfolioItems}
          posts={posts}
          theme={currentTheme}
          onOpenBookingModal={handleOpenBooking}
        />

        {/* 4.1 Vitrine de Produtos Físicos & Peças para Pedido via WhatsApp */}
        <PublicProductsSection
          products={products}
          tenantName={tenant.name}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          theme={currentTheme}
        />

        {/* 5. Sobre o Estabelecimento / Institucional */}
        <AboutBusinessSection
          tenantName={tenant.name}
          description={profile?.description}
          editorialSummary={profile?.editorial_summary}
          address={profile?.address}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          businessCategory={profile?.business_category}
          theme={currentTheme}
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* 6. Galeria de Fotos Reais do Google Maps (Lightbox) */}
        <PlacePhotoGallery
          photos={profile?.place_photos || []}
          tenantName={tenant.name}
          address={profile?.address}
          theme={currentTheme}
        />

        {/* 7. Prova Social Oficial (Google Reviews) */}
        <GoogleReviewsCard
          tenantName={tenant.name}
          rating={realRating}
          reviewCount={realReviewCount}
          reviews={reviews}
          googleMapsUrl={profile?.google_maps_url}
          theme={currentTheme}
        />

        {/* 8. Posts, Novidades & Artigos de SEO (se houver) */}
        <PublicPostsSection
          posts={posts}
          tenantName={tenant.name}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          theme={currentTheme}
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* 9. Horários da Semana, Endereço & Rotas GPS */}
        <MapLocationCard
          tenantName={tenant.name}
          address={profile?.address}
          latitude={profile?.latitude}
          longitude={profile?.longitude}
          openingHours={tenant.opening_hours || profile?.opening_hours_json}
          googleMapsUrl={profile?.google_maps_url}
          isOpenNow={isOpenNow}
          statusDetailText={statusDetailText}
          statusBadgeText={statusBadgeText}
          theme={currentTheme}
        />

      </main>

      {/* 10. Footer com Resumo e Ações Rápidas */}
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

      {/* 11. Barra Fixa Mobile */}
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
