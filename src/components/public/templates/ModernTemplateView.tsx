"use client";

import React from "react";
import {
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  Calendar,
  Star,
  ShieldCheck,
  ExternalLink,
  Navigation,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { TemplateViewProps } from "./ConversionTemplateView";
import { generateWhatsAppUrl, sanitizePhoneNumber, formatBrazilianPhone } from "@/utils/phone";
import { getContrastTextColor } from "@/utils/color";
import { PublicProductsSection } from "../PublicProductsSection";
import { PlacePhotoGallery } from "../PlacePhotoGallery";
import { MapLocationCard } from "../MapLocationCard";
import { GoogleReviewsCard } from "../GoogleReviewsCard";

export function ModernTemplateView({
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
  const whatsappUrl = generateWhatsAppUrl(rawPhone, tenant.name);

  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? reviews.length;

  const googleMapsUrl =
    profile?.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      tenant.name + " " + (profile?.address || "")
    )}`;

  const heroImage = profile?.hero_image_url || profile?.logo_url || (profile?.place_photos && profile.place_photos[0]) || "";
  const hoursList = tenant.opening_hours || profile?.opening_hours_json || [];
  const latestReview = reviews.length > 0 ? reviews[0] : null;

  // Extrair atributos de comodidades para chips
  const amenitiesList: string[] = [
    ...(tenant.business_attributes?.amenities || []),
    ...(tenant.business_attributes?.dining_options || []),
    ...(tenant.business_attributes?.atmosphere || []),
  ].slice(0, 6);

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      
      {/* 1. BENTO GRID PRINCIPAL (4 BLOCOS MODULARES ESTILO APPLE / LINEAR) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BLOCO 1 (2 Cols no Desktop): Apresentação e Especialidades da Casa */}
        <div className="md:col-span-2 rounded-3xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-7 sm:p-9 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs"
                style={{ backgroundColor: brandColor, color: contrastText }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{profile?.business_category || tenant.category || "Especialidades"}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 px-3 py-1 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span className="truncate max-w-[220px]">{profile?.address || "Atendimento Presencial"}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-950 dark:text-white tracking-tight leading-[1.12]">
              {tenant.name}
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl font-normal">
              {profile?.editorial_summary || profile?.description || "Qualidade superior, atendimento de excelência e estrutura moderna pensada no seu conforto."}
            </p>

            {/* Imagem de Destaque com visual Bento se houver */}
            {heroImage && (
              <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden border border-neutral-100 dark:border-white/10 shadow-inner group">
                <img
                  src={heroImage}
                  alt={tenant.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/50 via-transparent to-transparent" />
              </div>
            )}

            {/* Chips de Especialidades / Comodidades */}
            {amenitiesList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {amenitiesList.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/50 dark:border-white/10 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 text-xs font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BLOCO 2 (1 Col no Desktop): Status e Horário de Funcionamento em Tempo Real */}
        <div className="md:col-span-1 rounded-3xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                  <Clock className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Horário
                </h2>
              </div>

              {/* Status Aberto/Fechado em Tempo Real */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isOpenNow
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-600/20"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>{statusBadgeText || (isOpenNow ? "Aberto Agora" : "Fechado")}</span>
              </span>
            </div>

            <div className="rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 p-4 space-y-1">
              <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                Atendimento Hoje
              </span>
              <p className="text-xs text-neutral-800 dark:text-neutral-200 font-semibold">
                {statusDetailText || (isOpenNow ? "Atendimento em andamento" : "Consulte os horários da semana")}
              </p>
            </div>

            {/* Lista dos dias da semana */}
            {hoursList.length > 0 && (
              <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 divide-y divide-neutral-100 dark:divide-white/5">
                {hoursList.slice(0, 5).map((line: string, i: number) => (
                  <div key={i} className="pt-2 first:pt-0 flex justify-between font-mono text-[11px]">
                    <span className="truncate">{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-white/10">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center justify-between group transition"
            >
              <span>Ver rota e mapa completo</span>
              <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* BLOCO 3 (1 Col no Desktop): Resumo das Avaliações do Google */}
        <div className="md:col-span-1 rounded-3xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Avaliações Google
                </h2>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {realReviewCount} clientes avaliaram
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {Number(realRating).toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </div>

            {/* Destaque do depoimento real mais recente se houver */}
            {latestReview ? (
              <div className="rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 p-4 space-y-2">
                <p className="text-xs text-neutral-700 dark:text-neutral-300 italic line-clamp-3 leading-relaxed">
                  "{latestReview.text || latestReview.review_text}"
                </p>
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                  <span>{latestReview.author_name}</span>
                  <span className="text-amber-500 font-bold">{latestReview.rating}★</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Reconhecimento comprovado e alta pontuação por clientes locais.
              </p>
            )}
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center justify-between group pt-3 border-t border-neutral-100 dark:border-white/10 transition"
          >
            <span>Ver todas as avaliações</span>
            <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* BLOCO 4 (2 Cols no Desktop): Agendamento e Contato Rápido */}
        <div className="md:col-span-2 rounded-3xl border border-white/10 bg-neutral-950 text-white p-7 sm:p-9 shadow-xl shadow-black/25 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Confirmação Imediata</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Agendamento & Atendimento Rápido
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md">
              Garanta seu horário em instantes ou fale com nossa equipe diretamente pelo WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: brandColor, color: contrastText }}
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar Horário</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4 fill-white text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </section>

      {/* 2. CATÁLOGO DE SERVIÇOS EM BENTO CARDS */}
      {services.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <span>Catálogo & Cardápio</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
                Serviços & Especialidades
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Ver todos & Agendar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-3xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white tracking-tight leading-snug group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                      {service.name}
                    </h3>
                    {service.price && Number(service.price) > 0 ? (
                      <span className="shrink-0 text-sm font-extrabold text-neutral-950 dark:text-white bg-neutral-100 dark:bg-white/10 px-2.5 py-1 rounded-xl">
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                    ) : null}
                  </div>

                  {service.description && (
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-white/10">
                  {service.duration_minutes > 0 ? (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      ⏱ {service.duration_minutes} min
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">Atendimento presencial</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenBooking(service.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs"
                    style={{ backgroundColor: brandColor, color: contrastText }}
                  >
                    <span>Agendar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. PRODUTOS EM GRID MODULAR (SE HOUVER) */}
      {products.length > 0 && (
        <PublicProductsSection
          products={products}
          tenantName={tenant.name}
          phoneWhatsapp={rawPhone}
          theme={theme}
        />
      )}

      {/* 4. GALERIA DE FOTOS (SE HOUVER) */}
      {profile?.place_photos && profile.place_photos.length > 0 && (
        <PlacePhotoGallery
          photos={profile.place_photos}
          tenantName={tenant.name}
          address={profile.address}
          theme={theme}
        />
      )}

      {/* 5. AVALIAÇÕES GOOGLE REVIEWS */}
      <GoogleReviewsCard
        tenantName={tenant.name}
        rating={realRating}
        reviewCount={realReviewCount}
        reviews={reviews}
        googleMapsUrl={profile?.google_maps_url}
        theme={theme}
      />

      {/* 6. LOCALIZAÇÃO E HORÁRIOS */}
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
