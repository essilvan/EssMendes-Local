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
    <div className="space-y-10 pb-16">
      {/* 1. HERO DE ALTO IMPACTO (CONVERSION HERO) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-12 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Badge superior em destaque */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-extrabold shadow-lg tracking-wide uppercase"
            style={{ backgroundColor: brandColor, color: contrastText }}
          >
            <Zap className="h-4 w-4 fill-current shrink-0" />
            <span>⚡ Atendimento Imediato & Pedido Rápido</span>
          </div>

          {/* Título forte com foco em solução imediata */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {tenant.name}
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            {profile?.editorial_summary || profile?.description || "Atendimento prioritário com resposta rápida pelo WhatsApp. Solicite informações, orçamentos ou confirme seu pedido agora."}
          </p>

          {/* Dois botões de ação prioritária */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-lg mx-auto">
            {/* 1. Botão verde grande com ícone de WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base sm:text-lg px-7 py-4 shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="h-6 w-6 fill-white text-emerald-600 shrink-0" />
              <span>Falar no WhatsApp Agora</span>
            </a>

            {/* 2. Botão secundário de ligação */}
            {cleanPhone && (
              <a
                href={`tel:+55${cleanPhone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-base px-6 py-4 border border-slate-700 shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Ligar Agora</span>
              </a>
            )}
          </div>

          {/* Chamada alternativa para agendamento online */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white underline underline-offset-4 transition cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Ou prefere escolher data e horário online? Clique aqui</span>
            </button>
          </div>
        </div>

        {/* Fundo decorativo sutil */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: `${brandColor}15` }}
        />
      </section>

      {/* 2. BLOCO DE CONFIANÇA IMEDIATO (LOGO ABAIXO DO HERO) */}
      <section className="max-w-4xl mx-auto">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl border-2 border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/70 p-4 sm:p-5 shadow-sm hover:shadow-md transition hover:border-amber-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-xl shadow-xs shrink-0">
                {Number(realRating).toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="ml-1.5 text-xs font-extrabold text-slate-900">
                    {Number(realRating).toFixed(1)} no Google Maps
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Baseado em <strong className="text-slate-900">{realReviewCount} avaliações reais</strong> de clientes no Google
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 px-3 py-1 text-xs font-bold ring-1 ring-emerald-600/20">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>Perfil Verificado no Google</span>
              </span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-0.5">
                <span>Ver comentários</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </a>
      </section>

      {/* 3. CATÁLOGO DE AÇÃO DIRETA (SERVIÇOS DE ALTA CONVERSÃO) */}
      {services.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span
                className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1"
                style={{ backgroundColor: brandColor, color: contrastText }}
              >
                Serviços em Destaque
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Escolha o que Precisa e Peça Agora
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Resposta rápida e confirmação imediata
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              const serviceWhatsappUrl = generateWhatsAppUrl(
                rawPhone,
                tenant.name,
                `Olá! Gostaria de agendar ou tirar dúvidas sobre o serviço: "${service.name}".`
              );

              return (
                <div
                  key={service.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {service.name}
                      </h3>
                      {service.price && Number(service.price) > 0 ? (
                        <span className="shrink-0 text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          R$ {Number(service.price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Consulte
                        </span>
                      )}
                    </div>

                    {service.description && (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    {service.duration_minutes > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Duração estimada: {service.duration_minutes} min</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={serviceWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 shadow-xs transition"
                    >
                      <MessageCircle className="h-4 w-4 fill-white text-emerald-600 shrink-0" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onOpenBooking(service.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl text-xs font-bold py-2.5 px-3 shadow-xs transition cursor-pointer"
                      style={{ backgroundColor: brandColor, color: contrastText }}
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
