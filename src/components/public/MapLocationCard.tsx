"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Calendar,
} from "lucide-react";
import { getBusinessStatus } from "@/utils/opening-hours";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface MapLocationCardProps {
  tenantName: string;
  address?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: string[] | null;
  googleMapsUrl?: string | null;
  isOpenNow: boolean;
  statusDetailText?: string;
  statusBadgeText?: string;
  theme?: NicheThemeConfig;
  title?: string;
}

export function MapLocationCard({
  tenantName,
  address,
  placeId,
  latitude,
  longitude,
  openingHours,
  googleMapsUrl: customGoogleMapsUrl,
  isOpenNow,
  statusDetailText,
  statusBadgeText,
  theme,
  title,
}: MapLocationCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const currentTheme = theme || NICHE_THEMES.retail_default;

  const displayAddress = address || "Atendimento Presencial";
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(displayAddress)}`;

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const queryLocation = encodeURIComponent(`${tenantName}, ${address || ""}`);
  const mapEmbedSrc = (placeId && mapsApiKey)
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=place_id:${placeId}`
    : `https://maps.google.com/maps?q=${queryLocation}&t=&z=16&ie=UTF8&iwloc=B&output=embed`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${tenantName}, ${address || ""}`
  )}${placeId ? `&destination_place_id=${placeId}` : ""}`;

  const googleMapsUrl = customGoogleMapsUrl || directionsUrl;

  const businessStatus = getBusinessStatus(openingHours);
  const scheduleList = businessStatus.scheduleList;

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const statusLabel =
    (isOpenNow ? "Aberto agora" : "Fechado no momento") +
    (statusDetailText ? ` — ${statusDetailText}` : "");

  return (
    <div
      id="contato"
      className={`rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 md:p-10 space-y-8 shadow-xl shadow-black/5`}
    >
      {/* Header da Seção */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-white/10 pb-6`}>
        <div className="space-y-1.5">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
            <span>{currentTheme.icons?.contact || "📍"}</span>
            <span>Localização & Horários</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-extrabold ${currentTheme.textPrimary} tracking-tight`}>
            {title || "📅 HORÁRIOS & LOCALIZAÇÃO"}
          </h2>
          <p className={`text-xs sm:text-sm ${currentTheme.textMuted}`}>
            Venha nos visitar ou trace sua rota direta pelo Google Maps ou Waze.
          </p>
        </div>

        {/* Badge Aberto / Fechado em Tempo Real */}
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold self-start sm:self-auto ${
            businessStatus.isOpen
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              businessStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{businessStatus.label} — {businessStatus.subLabel}</span>
        </span>
      </div>

      {/* Grid Principal: Mapa & Endereço (Lado Esquerdo) | Tabela de Horários da Semana (Lado Direito) */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* =========================================================================
            LADO ESQUERDO: Mapa Visual, Endereço e Botões de Rota (7 Colunas)
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* Iframe Interativo do Google Maps com Pin Exato */}
          <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-white/10 shadow-sm">
            <iframe
              title={`Localização Google Maps - ${tenantName}`}
              src={mapEmbedSrc}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Bloco de Endereço + Botão Estilizado Como Chegar (Maps) */}
          <div className={`rounded-2xl border border-neutral-200/80 dark:border-white/10 ${
            currentTheme.isDark ? "bg-neutral-900/80" : "bg-neutral-50"
          } p-5 space-y-3`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${currentTheme.textMuted} flex items-center gap-1.5`}>
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Endereço Completo</span>
                </span>
                <p className={`text-xs sm:text-sm font-semibold ${currentTheme.textPrimary} leading-relaxed`}>
                  {displayAddress}
                </p>
              </div>

              {/* Botão Estilizado Como Chegar (Maps) */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-blue-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>🗺️ Como Chegar (Maps)</span>
              </a>
            </div>

            {address && (
              <button
                type="button"
                onClick={handleCopyAddress}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold hover:underline cursor-pointer ${currentTheme.accentText}`}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700 dark:text-emerald-400">Endereço copiado com sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Endereço</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Botões de Ação de Rota Direta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-blue-200/80 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/70 px-4 py-3 text-xs font-bold text-blue-950 dark:text-blue-200 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-2xs"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white font-black text-[10px]">
                  G
                </span>
                <span>🗺️ Como Chegar (Maps)</span>
              </span>
              <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-cyan-200/80 dark:border-cyan-500/20 bg-cyan-50/60 dark:bg-cyan-950/30 hover:bg-cyan-100/70 px-4 py-3 text-xs font-bold text-cyan-950 dark:text-cyan-200 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-2xs"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-600 text-white font-black text-[10px]">
                  W
                </span>
                <span>Traçar Rota no Waze</span>
              </span>
              <Navigation className="h-4 w-4 text-cyan-600" />
            </a>
          </div>

        </div>

        {/* =========================================================================
            LADO DIREITO: Tabela Detalhada de Horários da Semana (5 Colunas)
           ========================================================================= */}
        <div className={`lg:col-span-5 rounded-2xl border border-neutral-200/80 dark:border-white/10 ${
          currentTheme.isDark ? "bg-neutral-900/80" : "bg-neutral-50/80"
        } p-6 space-y-5 flex flex-col justify-between`}>
          
          <div className="space-y-4">
            {/* Header dos Horários */}
            <div className={`flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-3`}>
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className={`text-sm sm:text-base font-bold ${currentTheme.textPrimary} tracking-tight`}>
                  Horários de Atendimento
                </h3>
              </div>

              <span className={`text-[10px] font-semibold ${currentTheme.textMuted} uppercase tracking-wider`}>
                {businessStatus.hasOfficialHours ? "Oficial do Google" : "Horário Geral"}
              </span>
            </div>

            {/* Lista dos 7 Dias da Semana */}
            <div className="space-y-1.5 text-xs">
              {scheduleList.map((item) => (
                <div
                  key={item.day}
                  className={`flex items-center justify-between py-2 px-3 rounded-xl transition-all ${
                    item.isToday
                      ? currentTheme.isDark
                        ? "bg-neutral-800 border border-white/15 shadow-sm font-extrabold text-white"
                        : "bg-white border border-neutral-200 shadow-sm font-extrabold text-neutral-900"
                      : currentTheme.isDark
                      ? "text-neutral-400 hover:bg-neutral-800/50"
                      : "text-neutral-600 hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.isToday && (
                      <span
                        className="flex h-2 w-2 rounded-full bg-emerald-500"
                      />
                    )}
                    <span>{item.day}</span>
                    {item.isToday && (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
                      >
                        Hoje
                      </span>
                    )}
                  </div>

                  <span
                    className={
                      item.hours.toLowerCase().includes("fechado")
                        ? `${currentTheme.textMuted} font-medium`
                        : item.isToday
                        ? `font-extrabold ${currentTheme.textPrimary}`
                        : `font-semibold ${currentTheme.textPrimary}`
                    }
                  >
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dica de Atendimento Pontual */}
          <div className={`pt-3 border-t border-neutral-200/80 dark:border-white/10 text-xs ${currentTheme.textMuted} space-y-1`}>
            <p className={`flex items-center gap-1.5 font-bold ${currentTheme.textPrimary}`}>
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <span>Atendimento com Horário Marcado</span>
            </p>
            <p className="leading-relaxed">
              Evite esperas desnecessárias agendando seu atendimento online com antecedência.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
