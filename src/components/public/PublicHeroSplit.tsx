"use client";

import React from "react";
import {
  Calendar,
  MessageCircle,
  MapPin,
  Star,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  ArrowRight,
} from "lucide-react";
import type { TenantReview } from "@/types";
import { generateWhatsAppUrl } from "@/utils/phone";
import { sanitizeDescription } from "@/utils/address";

interface PublicHeroSplitProps {
  tenantName: string;
  description?: string | null;
  address?: string | null;
  phoneWhatsapp?: string | null;
  heroImageUrl?: string | null;
  placePhotos?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  businessCategory?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: TenantReview[];
  googleMapsUrl?: string | null;
  onOpenBooking: () => void;
}

export function PublicHeroSplit({
  tenantName,
  description,
  address,
  phoneWhatsapp,
  heroImageUrl,
  placePhotos,
  latitude,
  longitude,
  businessCategory,
  rating,
  reviewCount,
  reviews = [],
  googleMapsUrl: customGoogleMapsUrl,
  onOpenBooking,
}: PublicHeroSplitProps) {
  const displayAddress = address || "Atendimento Presencial com Estacionamento";
  const cleanDescription = sanitizeDescription(description, address);
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", tenantName);

  const mainImage =
    (placePhotos && placePhotos.length > 0 ? placePhotos[0] : null) ||
    heroImageUrl ||
    null;

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(displayAddress)}`;
  const googleMapsUrl =
    customGoogleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`);

  const hasRating = typeof rating === "number" && rating > 0;
  const hasReviewCount = typeof reviewCount === "number" && reviewCount > 0;
  const displayRating = hasRating ? rating.toFixed(1) : "5.0";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/70 p-6 sm:p-8 lg:p-10 shadow-sm">
      {/* Luz ambiente de fundo */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
      />
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
      />

      {/* Grid Split do Hero (Lado Esquerdo: Conteúdo & CTAs | Lado Direito: Foto & GPS) */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        
        {/* =========================================================================
            LADO ESQUERDO: Badge, Nome, Headline, 2 Botões e Mini-card Google (7 Colunas)
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Badge com a Categoria Real */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black tracking-wide uppercase shadow-2xs"
            style={{
              backgroundColor: "var(--primary-alpha-10, rgba(13, 148, 136, 0.1))",
              color: "var(--primary-color, #0d9488)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5 fill-current" />
            <span>{businessCategory ? `Especialistas em ${businessCategory}` : "Atendimento Profissional na Região"}</span>
          </div>

          {/* Nome da Empresa e Headline Dinâmica */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.12]">
              Excelência & Confiança no{" "}
              <span style={{ color: "var(--primary-color, #0d9488)" }}>
                {tenantName}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {cleanDescription ||
                `Conheça nossos serviços e faça seu agendamento de horário no ${tenantName}. Atendimento de excelência, pontualidade e satisfação garantida.`}
            </p>
          </div>

          {/* 2 Botões de Ação Imediata */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Botão Primário: Agendar Horário Online */}
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md transition hover:opacity-95 active:scale-95 cursor-pointer"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar Horário Online</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Botão Secundário: Conversar no WhatsApp */}
            {phoneWhatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50/80 hover:bg-emerald-100/80 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-extrabold text-emerald-800 transition shadow-2xs"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600 fill-current" />
                <span>Conversar no WhatsApp</span>
              </a>
            )}
          </div>

          {/* Mini-card de Autoridade Google (Applewood Style) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Google G Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900">
                    {displayRating}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    ({hasReviewCount ? `${reviewCount} avaliações` : "Google Business"})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Avaliações oficiais e presença verificada no Google Maps.
                </p>
              </div>
            </div>

            <a
              href="#avaliacoes"
              className="text-xs font-bold hover:underline self-start sm:self-auto text-slate-700 hover:text-slate-900"
            >
              Ver depoimentos →
            </a>
          </div>

        </div>

        {/* =========================================================================
            LADO DIREITO: Card Fotográfico com Card Suspenso "Estamos Aqui!" (5 Colunas)
           ========================================================================= */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-xl aspect-4/3 sm:aspect-16/11 flex flex-col justify-end group">
            {/* Foto Principal de Alta Resolução */}
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage}
                alt={`Instalações de ${tenantName}`}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white space-y-2 bg-gradient-to-br from-slate-800 to-slate-950">
                <Sparkles className="h-10 w-10 text-white/60" />
                <p className="font-black text-base">{tenantName}</p>
                <p className="text-xs text-white/70">{businessCategory || "Atendimento Local"}</p>
              </div>
            )}

            {/* Gradiente de Contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

            {/* Badge de Destaque no Topo da Imagem */}
            <div className="absolute top-3.5 left-3.5 z-10 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-xs border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Instalações Oficiais</span>
            </div>

            {/* Card Suspenso no Rodapé: "Estamos Aqui!" + Botões 1-clique Waze e Maps */}
            <div className="relative z-10 m-3 sm:m-4 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 sm:p-4 border border-slate-200/80 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-2xs"
                    style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                  >
                    <MapPin className="h-3 w-3" />
                  </div>
                  <span className="font-black text-xs text-slate-900 uppercase tracking-wider">
                    Estamos Aqui!
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg text-slate-800 transition"
                    title="Traçar rota no Waze"
                  >
                    <span className="text-[9px] font-black text-cyan-600">W</span>
                    <span>Waze</span>
                  </a>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg text-slate-800 transition"
                    title="Abrir no Google Maps"
                  >
                    <span className="text-[9px] font-black text-red-500">G</span>
                    <span>Maps</span>
                  </a>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-700 leading-snug truncate">
                {displayAddress}
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
