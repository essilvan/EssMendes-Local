"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MessageCircle,
  Phone,
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ArrowRight,
  Zap,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Navigation,
} from "lucide-react";
import type {
  Service,
  TenantProfile,
  PortfolioItem,
  TenantReview,
  TenantPost,
  TenantProduct,
  BusinessAttributes as BusinessAttributesType,
} from "@/types";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { generateWhatsAppUrl, sanitizePhoneNumber, formatBrazilianPhone } from "@/utils/phone";
import { getContrastTextColor } from "@/utils/color";
import { getUnifiedEstablishmentPhotos } from "@/utils/establishment-photos";
import { PublicProductsSection } from "../PublicProductsSection";
import { GoogleReviewsCard } from "../GoogleReviewsCard";
import { MapLocationCard } from "../MapLocationCard";
import { BusinessAttributes } from "../BusinessAttributes";
import { AboutBusinessSection } from "../AboutBusinessSection";

export interface TemplateViewProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    place_id?: string | null;
    google_place_id?: string | null;
    address?: string | null;
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
    cover_image_url?: string | null;
    photos?: string[] | null;
    google_photo_url?: string | null;
    [key: string]: any;
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
  brandColor: string;
  theme: NicheThemeConfig;
  onOpenBooking: (serviceId?: string) => void;
  heroImage?: string;
  galleryPhotos?: string[];
}

export function ConversionTemplateView({
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
  brandColor,
  theme,
  heroImage: customHeroImage,
  galleryPhotos: customGalleryPhotos,
  onOpenBooking,
}: TemplateViewProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const rawPhone = profile?.phone_whatsapp || profile?.phone || "";
  const cleanPhone = sanitizePhoneNumber(rawPhone);
  const whatsappUrl = generateWhatsAppUrl(
    rawPhone,
    tenant.name,
    `Olá! Gostaria de um atendimento imediato com ${tenant.name}.`
  );

  const photosData = getUnifiedEstablishmentPhotos(tenant, profile);
  const effectiveHeroImage = customHeroImage || photosData.heroImage;
  const effectiveGalleryPhotos =
    customGalleryPhotos && customGalleryPhotos.length > 0
      ? customGalleryPhotos
      : photosData.allPhotos;
  const allEstablishmentPhotos = photosData.allPhotos;

  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? reviews.length;

  const placeId =
    tenant.place_id ||
    tenant.google_place_id ||
    profile?.place_id ||
    profile?.google_place_id ||
    null;

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. HERO DE ALTO IMPACTO (CONVERSION HERO - COM FOTO REAL DE FUNDO & ALTO CONTRASTE) */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white p-7 sm:p-12 lg:p-16 border border-white/10 shadow-2xl shadow-black/40 min-h-[480px] flex items-center justify-center">
        {/* Foto de Destaque Obrigatória no Hero (object-cover) */}
        <div className="absolute inset-0 z-0">
          <Image
            src={effectiveHeroImage}
            alt={tenant.name}
            fill
            priority
            unoptimized
            referrerPolicy="no-referrer"
            className="object-cover object-center transform scale-105 filter brightness-90"
          />
          {/* Overlay escuro (bg-black/75 ou bg-neutral-950/80) para contraste máximo dos textos e botões */}
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-black/75" />
        </div>

        {/* Efeitos de iluminação ambiente suaves */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl z-1" />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-15 z-1"
          style={{ backgroundColor: brandColor }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6 sm:space-y-7">
          {/* Badge superior: "⚡ Atendimento Rápido • Aberto Agora" (estilo cápsula verde/escuro) */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide border border-emerald-500/30 bg-emerald-950/80 backdrop-blur-md text-emerald-400 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>⚡ Atendimento Rápido • Aberto Agora</span>
          </div>

          {/* Título do negócio em caixa alta, branco e negrito (tracking-tight font-bold text-3xl md:text-5xl) */}
          <h1 className="uppercase tracking-tight font-bold text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] sm:leading-[1.08] drop-shadow-md">
            {tenant.name}
          </h1>

          {/* Frase de impacto / descrição curta logo abaixo em tom dourado/off-white */}
          <p className="text-base sm:text-lg text-amber-100/90 dark:text-amber-100/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            {profile?.editorial_summary ||
              profile?.description ||
              "Atendimento prioritário com resposta rápida pelo WhatsApp. Solicite orçamentos, tire dúvidas ou faça seu pedido com total agilidade."}
          </p>

          {/* Prova social: Estrelas douradas (⭐⭐⭐⭐⭐), nota média (ex: 4.9) e contagem de avaliações entre parênteses */}
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-amber-400 text-sm">
              {Number(realRating).toFixed(1)}
            </span>
            <span className="text-white/80 text-xs font-medium">
              ({realReviewCount} avaliações)
            </span>
          </div>

          {/* Dois botões de ação lado a lado */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-lg mx-auto w-full">
            {/* 1. "💬 Falar no WhatsApp Agora" (verde chamativo, destaque primário) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base sm:text-lg px-8 py-4 shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5 fill-white text-emerald-500 shrink-0" />
              <span>💬 Falar no WhatsApp Agora</span>
            </a>

            {/* 2. "📞 Ligar Agora" (secundário com fundo neutro/cinza escuro) */}
            {cleanPhone && (
              <a
                href={`tel:+55${cleanPhone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-white font-semibold text-base px-7 py-4 border border-neutral-700/80 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-4 w-4 text-neutral-300 shrink-0" />
                <span>📞 Ligar Agora</span>
              </a>
            )}
          </div>

          {/* Chamada para agendamento online */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-neutral-400 hover:text-white transition cursor-pointer group"
            >
              <Calendar className="h-4 w-4 text-neutral-400 group-hover:text-emerald-400 transition" />
              <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white">
                Prefere escolher data e horário online? Clique aqui
              </span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. GALERIA / FOTOS DO LOCAL */}
      {effectiveGalleryPhotos.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
                <span>📸</span>
                <span>GALERIA / FOTOS DO LOCAL</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Salão, Pratos, Fachada e ambiente real do estabelecimento
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
              Fotos Reais
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {effectiveGalleryPhotos.map((photoUrl: string, idx: number) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-neutral-900 aspect-4/3 border border-neutral-200/80 dark:border-white/10 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  setSelectedPhotoIndex(idx);
                  setIsLightboxOpen(true);
                }}
              >
                <Image
                  src={photoUrl}
                  alt={`Foto ${idx + 1} - ${tenant.name}`}
                  fill
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-neutral-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. SERVIÇOS / CARDÁPIO COM PREÇOS */}
      {services.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-neutral-200/80 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
                <span>🍽️</span>
                <span>SERVIÇOS / CARDÁPIO COM PREÇOS</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Lista de itens atualizados com preços transparentes
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
              {services.length} Itens Disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => {
              const serviceWhatsappUrl = generateWhatsAppUrl(
                rawPhone,
                tenant.name,
                `Olá! Gostaria de pedir ou tirar dúvidas sobre o item: "${service.name}".`
              );

              return (
                <div
                  key={service.id}
                  className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    {/* Linha com Nome, Linha Pontilhada e Preço */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {service.name}
                      </h3>
                      <div className="flex-1 mx-3 border-b-2 border-dotted border-neutral-300 dark:border-neutral-700 min-w-4 self-center" />
                      <div className="shrink-0 text-right">
                        {service.price && Number(service.price) > 0 ? (
                          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            R$ {Number(service.price).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 px-2.5 py-1 rounded-md">
                            Sob Consulta
                          </span>
                        )}
                      </div>
                    </div>

                    {service.description && (
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    {service.duration_minutes > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium pt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Duração: {service.duration_minutes} min</span>
                      </div>
                    )}
                  </div>

                  {/* Ações do Serviço / Item */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-3">
                    <a
                      href={serviceWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3.5 shadow-sm shadow-emerald-600/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-white text-emerald-600 shrink-0" />
                      <span>Pedir no WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onOpenBooking(service.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Agendar Horário</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. PRODUTOS FÍSICOS (SE HOUVER) */}
      {products.length > 0 && (
        <PublicProductsSection
          products={products}
          tenantName={tenant.name}
          phoneWhatsapp={rawPhone}
          theme={theme}
        />
      )}

      {/* 5. AVALIAÇÕES DO GOOGLE MAPS */}
      {reviews.length > 0 && (
        <GoogleReviewsCard
          tenantName={tenant.name}
          rating={realRating}
          reviewCount={realReviewCount}
          reviews={reviews}
          googleMapsUrl={profile?.google_maps_url}
          theme={theme}
        />
      )}

      {/* 6. SOBRE & COMODIDADES */}
      {profile?.description && (
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
      )}

      {tenant.business_attributes && (
        <BusinessAttributes
          attributes={tenant.business_attributes}
          theme={theme}
        />
      )}

      {/* 7. HORÁRIOS & LOCALIZAÇÃO */}
      <MapLocationCard
        tenantName={tenant.name}
        address={profile?.address || tenant.address}
        placeId={placeId}
        latitude={profile?.latitude}
        longitude={profile?.longitude}
        openingHours={tenant.opening_hours || profile?.opening_hours_json}
        googleMapsUrl={profile?.google_maps_url}
        isOpenNow={isOpenNow}
        statusDetailText={statusDetailText}
        statusBadgeText={statusBadgeText}
        theme={theme}
        title="📅 HORÁRIOS & LOCALIZAÇÃO"
      />

      {/* Modal Lightbox para fotos em tamanho real */}
      {isLightboxOpen && allEstablishmentPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="relative w-full h-full max-h-[75vh]">
              <Image
                src={
                  allEstablishmentPhotos[selectedPhotoIndex] ||
                  allEstablishmentPhotos[0]
                }
                alt={`Foto ${selectedPhotoIndex + 1} - ${tenant.name}`}
                fill
                unoptimized
                referrerPolicy="no-referrer"
                className="object-contain"
              />
            </div>

            {allEstablishmentPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex((prev) =>
                      prev === 0 ? allEstablishmentPhotos.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-2 sm:left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 transition cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex((prev) =>
                      prev === allEstablishmentPhotos.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-2 sm:right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 transition cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
