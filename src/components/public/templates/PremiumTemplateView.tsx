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
import { PublicRestaurantMenuSection } from "../PublicRestaurantMenuSection";
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
  menuCategories = [],
  menuItems = [],
  isOpenNow,
  statusBadgeText,
  statusDetailText,
  brandColor,
  theme,
  heroImage: customHeroImage,
  galleryPhotos: customGalleryPhotos,
  onOpenBooking,
  onOpenVehicleQuote,
}: TemplateViewProps) {
  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? reviews.filter((r) => r.is_visible !== false).length;
  const rawPhone =
    profile?.phone_whatsapp ||
    profile?.phone ||
    (tenant as any)?.whatsapp ||
    tenant.phone ||
    "";
  const isRestaurant =
    tenant.niche === "restaurant" ||
    theme?.id === "restaurant" ||
    theme?.id === "gastronomia" ||
    theme?.id === "food";

  const photosData = getUnifiedEstablishmentPhotos(tenant, profile);
  const effectiveHeroImage = customHeroImage || photosData.heroImage;
  const effectiveGalleryPhotos = (customGalleryPhotos && customGalleryPhotos.length > 0) ? customGalleryPhotos : photosData.galleryPhotos;
  const allEstablishmentPhotos = photosData.allPhotos;
  const coverImage = (tenant as any).cover_url || tenant.cover_image_url || profile?.cover_image_url || effectiveHeroImage;

  return (
    <div className="space-y-16 md:space-y-24 py-6 sm:py-10">
      {/* 1º TOPO: Hero Section Universal com Efeito Glassmorphism e Foto de Capa */}
      <PublicHeroSplit
        tenant={tenant}
        services={services}
        tenantName={tenant.name}
        logoUrl={profile?.logo_url || (tenant as any).logo_url}
        coverUrl={coverImage}
        description={tenant?.description || profile?.description}
        headline={tenant?.headline || profile?.editorial_summary}
        address={profile?.address || tenant.address}
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
        ctaText={tenant?.cta_text || (tenant?.theme_settings as any)?.cta_text}
        onOpenBooking={() => onOpenBooking()}
        onOpenVehicleQuote={onOpenVehicleQuote}
      />

      {/* 2º SEÇÃO DO CARDÁPIO DIGITAL (Logo abaixo do Hero para Restaurante / Bar) */}
      {isRestaurant ? (
        <PublicRestaurantMenuSection
          tenantId={tenant.id}
          tenantName={tenant.name}
          tenantSlug={tenant.slug}
          categories={menuCategories}
          items={menuItems}
          restaurantPhone={rawPhone}
        />
      ) : (
        <>
          {/* 2. Faixa de Pilares de Confiança Nobre (4 Blocos Dinâmicos via Supabase) */}
          <TrustMetricsBar
            rating={realRating}
            reviewCount={realReviewCount}
            businessCategory={profile?.business_category}
            theme={theme}
            services={services}
            tenant={tenant}
            onSelectService={(serviceId) => onOpenBooking(serviceId)}
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
        </>
      )}

      {/* 3º SEÇÕES COMPLEMENTARES: Avaliações, Galeria de Fotos, Sobre, Posts e Mapa/Endereço */}
      <GoogleReviewsCard
        tenantName={tenant.name}
        rating={realRating}
        reviewCount={realReviewCount}
        reviews={reviews.filter((r) => r.is_visible !== false)}
        googleMapsUrl={profile?.google_maps_url}
        theme={theme}
      />

      {/* Galeria de Fotos Reais do Estabelecimento em Alta Resolução */}
      {allEstablishmentPhotos.length > 0 && (
        <PlacePhotoGallery
          photos={allEstablishmentPhotos}
          tenantName={tenant.name}
          address={profile?.address}
          theme={theme}
          title="Fotos do Estabelecimento • Nosso Ambiente"
        />
      )}

      {/* Sobre o Estabelecimento / Institucional Amplo */}
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

      {/* Comodidades & Atributos do Google Maps */}
      {tenant.business_attributes && (
        <BusinessAttributes
          attributes={tenant.business_attributes}
          theme={theme}
        />
      )}

      {/* Posts & Artigos de SEO Local */}
      {posts.length > 0 && (
        <PublicPostsSection
          posts={posts}
          tenantName={tenant.name}
          phoneWhatsapp={rawPhone}
          theme={theme}
          brandColor={brandColor}
          onOpenBooking={() =>
            onOpenVehicleQuote ? onOpenVehicleQuote() : onOpenBooking()
          }
        />
      )}

      {/* Horários da Semana, Endereço & Rotas GPS */}
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
