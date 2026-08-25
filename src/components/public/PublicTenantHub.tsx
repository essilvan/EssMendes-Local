"use client";

import React, { useState } from "react";
import type {
  Service,
  TenantProfile,
  PortfolioItem,
  TenantReview,
  TenantPost,
} from "@/types";
import { getThemeColorStyles } from "@/utils/color";
import { PublicHeader } from "./PublicHeader";
import { PublicHeroSplit } from "./PublicHeroSplit";
import { TrustMetricsBar } from "./TrustMetricsBar";
import { ConversionDashboard } from "./ConversionDashboard";
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
  };
  profile: TenantProfile | null;
  services: Service[];
  portfolioItems: PortfolioItem[];
  reviews?: TenantReview[];
  posts?: TenantPost[];
  isOpenNow: boolean;
  statusBadgeText?: string;
  statusDetailText?: string;
}

export function PublicTenantHub({
  tenant,
  profile,
  services,
  portfolioItems,
  reviews = [],
  posts = [],
  isOpenNow,
  statusBadgeText,
  statusDetailText,
}: PublicTenantHubProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  const primaryColor = profile?.primary_color || "#0d9488";
  const themeStyles = getThemeColorStyles(primaryColor);

  const realRating = profile?.google_rating ?? profile?.rating ?? null;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? null;

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

  return (
    <div
      style={themeStyles}
      className="min-h-screen bg-slate-100/70 text-slate-900 selection:bg-slate-900 selection:text-white"
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
        isOpenNow={isOpenNow}
        statusBadgeText={statusBadgeText}
        statusDetailText={statusDetailText}
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
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* 3. Faixa de Pilares de Confiança Universal (4 Blocos) */}
        <TrustMetricsBar
          rating={realRating}
          reviewCount={realReviewCount}
          businessCategory={profile?.business_category}
        />

        {/* 4. Dashboard de Conversão (Catálogo de Serviços + Antes & Depois / Promo + Widget de Agendamento) */}
        <ConversionDashboard
          tenant={tenant}
          profile={profile}
          services={services}
          portfolioItems={portfolioItems}
          posts={posts}
          onOpenBookingModal={handleOpenBooking}
        />

        {/* 5. Sobre o Estabelecimento / Institucional */}
        <AboutBusinessSection
          tenantName={tenant.name}
          description={profile?.description}
          editorialSummary={profile?.editorial_summary}
          address={profile?.address}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          businessCategory={profile?.business_category}
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* 6. Galeria de Fotos Reais do Google Maps (Lightbox) */}
        <PlacePhotoGallery
          photos={profile?.place_photos || []}
          tenantName={tenant.name}
          address={profile?.address}
        />

        {/* 7. Prova Social Oficial (Google Reviews) */}
        <GoogleReviewsCard
          tenantName={tenant.name}
          rating={realRating}
          reviewCount={realReviewCount}
          reviews={reviews}
          googleMapsUrl={profile?.google_maps_url}
        />

        {/* 8. Posts, Novidades & Artigos de SEO (se houver) */}
        <PublicPostsSection
          posts={posts}
          tenantName={tenant.name}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* 9. Horários da Semana, Endereço & Rotas GPS */}
        <MapLocationCard
          tenantName={tenant.name}
          address={profile?.address}
          latitude={profile?.latitude}
          longitude={profile?.longitude}
          openingHours={profile?.opening_hours_json}
          googleMapsUrl={profile?.google_maps_url}
          isOpenNow={isOpenNow}
          statusDetailText={statusDetailText}
          statusBadgeText={statusBadgeText}
        />

      </main>

      {/* 10. Footer com Resumo e Ações Rápidas */}
      <PublicFooter
        tenantName={tenant.name}
        phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
        address={profile?.address}
        latitude={profile?.latitude}
        longitude={profile?.longitude}
        openingHours={profile?.opening_hours_json}
        isOpenNow={isOpenNow}
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
