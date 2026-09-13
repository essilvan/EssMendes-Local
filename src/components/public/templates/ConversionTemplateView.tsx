"use client";

import React from "react";
import {
  MessageCircle,
  Phone,
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Zap,
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
  brandColor: string;
  theme: NicheThemeConfig;
  onOpenBooking: (serviceId?: string) => void;
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
  onOpenBooking,
}: TemplateViewProps) {
  const contrastText = getContrastTextColor(brandColor);
  const rawPhone = profile?.phone_whatsapp || profile?.phone || "";
  const cleanPhone = sanitizePhoneNumber(rawPhone);
  const formattedPhone = formatBrazilianPhone(rawPhone);
  const whatsappUrl = generateWhatsAppUrl(
    rawPhone,
    tenant.name,
    `Olá! Gostaria de um atendimento imediato com ${tenant.name}.`
  );

  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? reviews.length;

  const googleMapsUrl = profile?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.name + " " + (profile?.address || ""))}`;

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. HERO DE ALTO IMPACTO (CONVERSION HERO - APPLE & LINEAR STYLE) */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white p-7 sm:p-12 lg:p-16 border border-white/10 shadow-2xl shadow-black/40">
        {/* Efeitos de iluminação ambiente suaves */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: brandColor }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-7">
          {/* Badge cápsula refinada com micro-interação */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide border border-white/15 bg-white/5 backdrop-blur-md text-emerald-400 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white/90">⚡ Atendimento Rápido</span>
            <span className="text-white/30">•</span>
            <span className="text-emerald-400 font-bold">
              {isOpenNow ? "Aberto Agora" : "Atendimento Online"}
            </span>
          </div>

          {/* Título com tracking refinado e contraste impecável */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] sm:leading-[1.08]">
            {tenant.name}
          </h1>

          {/* Descrição legível com entrelinha relaxada */}
          <p className="text-base sm:text-lg text-neutral-300 font-normal max-w-2xl mx-auto leading-relaxed">
            {profile?.editorial_summary ||
              profile?.description ||
              "Atendimento prioritário com resposta rápida pelo WhatsApp. Solicite orçamentos, tire dúvidas ou agende seu horário com total agilidade."}
          </p>

          {/* Ações Primárias com acabamento nobre */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-lg mx-auto">
            {/* 1. Botão WhatsApp com verde esmeralda refinado */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg px-8 py-4 shadow-xl shadow-emerald-600/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5 fill-white text-emerald-600 shrink-0" />
              <span>Falar no WhatsApp Agora</span>
            </a>

            {/* 2. Botão secundário de ligação com visual translúcido */}
            {cleanPhone && (
              <a
                href={`tel:+55${cleanPhone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base px-6 py-4 border border-white/15 backdrop-blur-md shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Ligar Agora</span>
              </a>
            )}
          </div>

          {/* Chamada sutil para agendamento online */}
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

      {/* 2. BLOCO DE CONFIANÇA IMEDIATO (LOGO ABAIXO DO HERO) */}
      <section className="max-w-4xl mx-auto -mt-6 sm:-mt-10 relative z-20 px-2 sm:px-4">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-300 hover:border-neutral-300 dark:hover:border-white/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold text-2xl shrink-0 shadow-inner">
                {Number(realRating).toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {Number(realRating).toFixed(1)} de 5.0
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Baseado em <strong className="text-neutral-900 dark:text-white">{realReviewCount} avaliações reais</strong> verificadas no Google Maps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Perfil Verificado</span>
              </span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white flex items-center gap-1 transition">
                <span>Ver comentários</span>
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </a>
      </section>

      {/* 3. CATÁLOGO DE AÇÃO DIRETA (SERVIÇOS DE ALTA CONVERSÃO) */}
      {services.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                <span>Serviços & Atendimentos</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Escolha o que Precisa e Peça Agora
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Resposta rápida e confirmação imediata
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {services.map((service) => {
              const serviceWhatsappUrl = generateWhatsAppUrl(
                rawPhone,
                tenant.name,
                `Olá! Gostaria de agendar ou tirar dúvidas sobre o serviço: "${service.name}".`
              );

              return (
                <div
                  key={service.id}
                  className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {service.name}
                      </h3>
                      {service.price && Number(service.price) > 0 ? (
                        <span className="shrink-0 text-sm font-extrabold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                          R$ {Number(service.price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                          Sob Consulta
                        </span>
                      )}
                    </div>

                    {service.description && (
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    {service.duration_minutes > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Duração estimada: {service.duration_minutes} min</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-neutral-100 dark:border-white/10">
                    <a
                      href={serviceWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3 px-3 shadow-md shadow-emerald-600/15 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="h-4 w-4 fill-white text-emerald-600 shrink-0" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onOpenBooking(service.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-white/15 bg-neutral-50 hover:bg-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-semibold py-3 px-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Agendar</span>
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

      {/* 5. SOBRE & COMODIDADES */}
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

      {tenant.business_attributes && (
        <BusinessAttributes
          attributes={tenant.business_attributes}
          theme={theme}
        />
      )}

      {/* 6. PROVA SOCIAL OFICIAL */}
      <GoogleReviewsCard
        tenantName={tenant.name}
        rating={realRating}
        reviewCount={realReviewCount}
        reviews={reviews}
        googleMapsUrl={profile?.google_maps_url}
        theme={theme}
      />

      {/* 7. HORÁRIOS & LOCALIZAÇÃO */}
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
        theme={theme}
      />
    </div>
  );
}
