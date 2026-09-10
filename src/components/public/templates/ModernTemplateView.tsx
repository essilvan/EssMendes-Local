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
    <div className="space-y-8 pb-16">
      
      {/* 1. BENTO GRID PRINCIPAL (4 BLOCOS MODULARES) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* BLOCO 1 (2 Cols no Desktop): Apresentação e Especialidades da Casa */}
        <div className="md:col-span-2 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs"
                style={{ backgroundColor: brandColor, color: contrastText }}
              >
                <Sparkles className="h-3 w-3" />
                <span>{profile?.business_category || tenant.category || "Especialidades da Casa"}</span>
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span className="truncate max-w-[200px]">{profile?.address || "Atendimento Presencial"}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {tenant.name}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              {profile?.editorial_summary || profile?.description || "Qualidade superior, atendimento de excelência e estrutura moderna pensada no seu conforto."}
            </p>

            {/* Imagem de Destaque com visual Bento se houver */}
            {heroImage && (
              <div className="relative h-44 sm:h-56 w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                <img
                  src={heroImage}
                  alt={tenant.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            )}

            {/* Chips de Especialidades / Comodidades */}
            {amenitiesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {amenitiesList.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-medium"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BLOCO 2 (1 Col no Desktop): Status e Horário de Funcionamento em Tempo Real */}
        <div className="md:col-span-1 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <Clock className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Horário
                </h2>
              </div>

              {/* Status Aberto/Fechado em Tempo Real */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isOpenNow
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/30"
                    : "bg-amber-50 text-amber-800 ring-1 ring-amber-600/30"
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

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Atendimento Hoje
              </span>
              <p className="text-xs text-slate-800 font-semibold">
                {statusDetailText || (isOpenNow ? "Atendimento em andamento" : "Consulte os horários da semana")}
              </p>
            </div>

            {/* Lista dos dias da semana */}
            {hoursList.length > 0 && (
              <div className="space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100/80">
                {hoursList.slice(0, 5).map((line: string, i: number) => (
                  <div key={i} className="pt-1.5 first:pt-0 flex justify-between font-mono text-[11px]">
                    <span className="truncate">{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-between group"
            >
              <span>Ver rota e mapa completo</span>
              <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* BLOCO 3 (1 Col no Desktop): Resumo das Avaliações do Google */}
        <div className="md:col-span-1 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Avaliações Google
                </h2>
                <span className="text-[11px] text-slate-500">
                  {realReviewCount} clientes avaliaram
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-4xl font-black text-slate-900">
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
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 space-y-1.5">
                <p className="text-xs text-slate-700 italic line-clamp-3 leading-relaxed">
                  "{latestReview.text || latestReview.review_text}"
                </p>
                <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between pt-1">
                  <span>{latestReview.author_name}</span>
                  <span className="text-amber-500 font-black">{latestReview.rating}★</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Reconhecimento comprovado e alta pontuação por clientes locais.
              </p>
            )}
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-between group pt-2 border-t border-slate-100"
          >
            <span>Ver todas as avaliações</span>
            <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* BLOCO 4 (2 Cols no Desktop): Agendamento e Contato Rápido */}
        <div className="md:col-span-2 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 text-xs font-extrabold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Confirmação Direta</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Agendamento & Atendimento Imediato
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              Garanta seu horário em minutos ou fale com nossa equipe diretamente pelo WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold shadow-lg transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: brandColor, color: contrastText }}
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar Horário</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3.5 text-sm font-bold shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4 fill-white text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </section>

      {/* 2. CATÁLOGO DE SERVIÇOS EM BENTO CARDS */}
      {services.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Serviços & Especialidades
              </h2>
              <p className="text-xs text-slate-500">
                Escolha o serviço desejado para agendar ou pedir informações
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="text-xs font-bold text-slate-800 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {service.name}
                    </h3>
                    {service.price && Number(service.price) > 0 ? (
                      <span className="shrink-0 text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                    ) : null}
                  </div>

                  {service.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {service.duration_minutes > 0 ? (
                    <span className="text-[11px] text-slate-500 font-medium">
                      ⏱ {service.duration_minutes} min
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Atendimento presencial</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenBooking(service.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
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
