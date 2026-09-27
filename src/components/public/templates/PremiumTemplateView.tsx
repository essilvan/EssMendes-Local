"use client";

import React from "react";
import type { TemplateViewProps } from "./ConversionTemplateView";
import { getUnifiedEstablishmentPhotos } from "@/utils/establishment-photos";
import { PublicHeroSplit } from "../PublicHeroSplit";
import { TrustMetricsBar } from "../TrustMetricsBar";
import { ConversionDashboard } from "../ConversionDashboard";
import { PublicProfessionalsSection } from "../PublicProfessionalsSection";
import { PublicProductsSection } from "../PublicProductsSection";
import { AboutBusinessSection } from "../AboutBusinessSection";
import { PlacePhotoGallery } from "../PlacePhotoGallery";
import { GoogleReviewsCard } from "../GoogleReviewsCard";
import { PublicPostsSection } from "../PublicPostsSection";
import { MapLocationCard } from "../MapLocationCard";
import { BusinessAttributes } from "../BusinessAttributes";

export function PremiumTemplateView({
  tenant,
  profile,
  services,
  professionals = [],
  portfolioItems,
  reviews = [],
  posts = [],
  products = [],
  isOpenNow,
  statusBadgeText,
  statusDetailText,
  brandColor,
  theme,
  heroImage: customHeroImage,
  galleryPhotos: customGalleryPhotos,
  onOpenBooking,
}: TemplateViewProps) {
  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? reviews.filter((r) => r.is_visible !== false).length;
  const rawPhone = profile?.phone_whatsapp || profile?.phone || "";

  const photosData = getUnifiedEstablishmentPhotos(tenant, profile);
  const effectiveHeroImage = customHeroImage || photosData.heroImage;
  const effectiveGalleryPhotos = (customGalleryPhotos && customGalleryPhotos.length > 0) ? customGalleryPhotos : photosData.galleryPhotos;
  const allEstablishmentPhotos = photosData.allPhotos;
  const coverImage = (tenant as any).cover_url || tenant.cover_image_url || profile?.cover_image_url || effectiveHeroImage;

  return (
    <div className="space-y-16 md:space-y-24 py-6 sm:py-10">
      {/* 1. Hero Section Universal com Efeito Glassmorphism e Foto de Capa */}
      <PublicHeroSplit
        tenantName={tenant.name}
        logoUrl={profile?.logo_url || (tenant as any).logo_url}
        coverUrl={coverImage}
        description={profile?.description}
        address={profile?.address}
        phoneWhatsapp={rawPhone}
        heroImageUrl={effectiveHeroImage}
        placePhotos={allEstablishmentPhotos}
        latitude={profile?.latitude}
        longitude={profile?.longitude}
        businessCategory={profile?.business_category}
        rating={realRating}
        reviewCount={realReviewCount}
        reviews={reviews.filter((r) => r.is_visible !== false)}
        googleMapsUrl={profile?.google_maps_url}
        isOpenNow={isOpenNow}
        statusBadgeText={statusBadgeText}
        brandColor={brandColor}
        theme={theme}
        onOpenBooking={() => onOpenBooking()}
      />

      {/* 2. Faixa de Pilares de Confiança Nobre (4 Blocos) */}
      <TrustMetricsBar
        rating={realRating}
        reviewCount={realReviewCount}
        businessCategory={profile?.business_category}
        theme={theme}
      />

      {/* 3. Dashboard de Conversão Refinado (Catálogo de Serviços + Antes & Depois + Agendamento) */}
      <ConversionDashboard
        tenant={tenant}
        profile={profile}
        services={services}
        portfolioItems={portfolioItems}
        posts={posts}
        theme={theme}
        brandColor={brandColor}
        onOpenBookingModal={onOpenBooking}
      />

      {/* 3.5 Secção da Equipe / Profissionais com Agendamento Direto */}
      {professionals && professionals.length > 0 && (
        <PublicProfessionalsSection
          professionals={professionals}
          tenantName={tenant.name}
          brandColor={brandColor}
          theme={theme}
          onSelectProfessional={(profId) => onOpenBooking(undefined, profId)}
        />
      )}

      {/* 4. Vitrine de Produtos Físicos & Peças Nobre */}
      {products.length > 0 && (
        <PublicProductsSection
          products={products}
          tenantName={tenant.name}
          phoneWhatsapp={rawPhone}
          theme={theme}
        />
      )}

      {/* 5. Sobre o Estabelecimento / Institucional Amplo */}
      <AboutBusinessSection
        tenantName={tenant.name}
        description={profile?.description}
        editorialSummary={profile?.editorial_summary}
        address={profile?.address}
        phoneWhatsapp={rawPhone}
        businessCategory={profile?.business_category}
        theme={theme}
        onOpenBooking={() => onOpenBooking()}
      />

      {/* 6. Galeria de Fotos Reais do Estabelecimento em Alta Resolução */}
      {allEstablishmentPhotos.length > 0 && (
        <PlacePhotoGallery
          photos={allEstablishmentPhotos}
          tenantName={tenant.name}
          address={profile?.address}
          theme={theme}
          title="Fotos do Estabelecimento • Nosso Ambiente"
        />
      )}

      {/* 6.1 Comodidades & Atributos do Google Maps */}
      {tenant.business_attributes && (
        <BusinessAttributes
          attributes={tenant.business_attributes}
          theme={theme}
        />
      )}

      {/* 7. Prova Social Oficial (Google Reviews) */}
      <GoogleReviewsCard
        tenantName={tenant.name}
        rating={realRating}
        reviewCount={realReviewCount}
        reviews={reviews.filter((r) => r.is_visible !== false)}
        googleMapsUrl={profile?.google_maps_url}
        theme={theme}
      />

      {/* 8. Posts & Artigos de SEO Local */}
      {posts.length > 0 && (
        <PublicPostsSection
          posts={posts}
          tenantName={tenant.name}
          phoneWhatsapp={rawPhone}
          theme={theme}
          onOpenBooking={() => onOpenBooking()}
        />
      )}

      {/* 9. Horários da Semana, Endereço & Rotas GPS */}
      <MapLocationCard
        tenantName={tenant.name}
        address={profile?.address || tenant.address}
        placeId={tenant.place_id || tenant.google_place_id || profile?.place_id || profile?.google_place_id}
        latitude={profile?.latitude}
        longitude={profile?.longitude}
        openingHours={tenant.opening_hours || profile?.opening_hours_json}
        googleMapsUrl={profile?.google_maps_url}
        isOpenNow={isOpenNow}
        statusDetailText={statusDetailText}
        statusBadgeText={statusBadgeText}
        theme={theme}
      />
    </div>
  );
}
