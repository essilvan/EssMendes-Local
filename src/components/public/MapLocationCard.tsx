"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Clock,
  Calendar,
} from "lucide-react";
import { getBusinessStatus } from "@/utils/opening-hours";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface MapLocationCardProps {
  tenantName: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: string[] | null;
  googleMapsUrl?: string | null;
  isOpenNow: boolean;
  statusDetailText?: string;
  statusBadgeText?: string;
  theme?: NicheThemeConfig;
}

export function MapLocationCard({
  tenantName,
  address,
  latitude,
  longitude,
  openingHours,
  googleMapsUrl: customGoogleMapsUrl,
  isOpenNow,
  statusDetailText,
  statusBadgeText,
  theme,
}: MapLocationCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const currentTheme = theme || NICHE_THEMES.retail_default;

  const displayAddress = address || "Atendimento Presencial";
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(displayAddress)}`;

  const googleMapsUrl =
    customGoogleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`);

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
      className={`${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-8 space-y-6`}
    >
      {/* Header da Seção */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${currentTheme.borderClass} pb-4`}>
        <div>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
            <MapPin className="h-3.5 w-3.5" />
            <span>Localização & Horários</span>
          </div>
          <h2 className={`mt-1 text-lg sm:text-xl font-black ${currentTheme.textPrimary}`}>
            Endereço, Horários da Semana & Rotas GPS
          </h2>
          <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
            Venha nos visitar ou trace sua rota direta pelo Waze ou Google Maps.
          </p>
        </div>

        {/* Badge Aberto / Fechado em Tempo Real */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 self-start sm:self-auto ${
            isOpenNow
              ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
              : "bg-amber-50 text-amber-800 ring-amber-600/20"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Grid Principal: Mapa & Endereço (Lado Esquerdo) | Tabela de Horários da Semana (Lado Direito) */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* =========================================================================
            LADO ESQUERDO: Mapa Visual, Endereço e Botões de Rota (7 Colunas)
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* Card Visual do Mapa */}
          <div className="relative min-h-[220px] sm:min-h-[240px] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-slate-200/80 to-slate-100 overflow-hidden shadow-inner flex flex-col items-center justify-center p-6 text-center">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Marcador Centralizado */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl ring-4 ring-white transition transform hover:scale-105"
                style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
              >
                <Building2 className="h-7 w-7" />
                <span
                  className="absolute -bottom-2 h-3 w-3 rotate-45"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                />
              </div>

              <div className="mt-3.5 rounded-xl bg-white/95 backdrop-blur-xs px-3.5 py-1.5 shadow-md border border-slate-200 text-xs font-black text-slate-900">
                {tenantName}
              </div>
              <p className="mt-1 text-[11px] text-slate-600 max-w-sm font-medium truncate">
                {displayAddress}
              </p>
            </div>

            {/* Botão Flutuante Expandir Mapa */}
            <div className="absolute bottom-3 right-3 z-10">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-xs px-2.5 py-1.5 text-[11px] font-bold text-slate-800 border border-slate-200 shadow-xs hover:bg-white transition"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Expandir Mapa</span>
              </a>
            </div>
          </div>

          {/* Bloco de Endereço + Botão Copiar */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-600" />
              Endereço Completo
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
              {displayAddress}
            </p>

            {address && (
              <button
                type="button"
                onClick={handleCopyAddress}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer"
                style={{ color: "var(--primary-color, #0d9488)" }}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">Endereço copiado!</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/70 hover:bg-cyan-100/80 px-4 py-3 text-xs font-bold text-cyan-950 transition shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-600 text-white font-black text-[10px]">
                  W
                </span>
                Traçar Rota no Waze
              </span>
              <Navigation className="h-4 w-4 text-cyan-700" />
            </a>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 transition shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500 text-white font-black text-[10px]">
                  G
                </span>
                Abrir no Google Maps
              </span>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </a>
          </div>

        </div>

        {/* =========================================================================
            LADO DIREITO: Tabela Detalhada de Horários da Semana (5 Colunas)
           ========================================================================= */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 space-y-4 flex flex-col justify-between">
          
          <div className="space-y-3">
            {/* Header dos Horários */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  Horários de Atendimento
                </h3>
              </div>

              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Semana Oficial
              </span>
            </div>

            {/* Lista dos 7 Dias da Semana */}
            <div className="space-y-1.5 text-xs">
              {scheduleList.map((item) => (
                <div
                  key={item.day}
                  className={`flex items-center justify-between py-2 px-3 rounded-xl transition ${
                    item.isToday
                      ? "bg-white border border-slate-200 shadow-2xs font-extrabold text-slate-900"
                      : "text-slate-600 hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.isToday && (
                      <span
                        className="flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                      />
                    )}
                    <span>{item.day}</span>
                    {item.isToday && (
                      <span
                        className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: "var(--primary-alpha-10, rgba(13, 148, 136, 0.1))",
                          color: "var(--primary-color, #0d9488)",
                        }}
                      >
                        Hoje
                      </span>
                    )}
                  </div>

                  <span
                    className={
                      item.hours.toLowerCase().includes("fechado")
                        ? "text-slate-400 font-medium"
                        : item.isToday
                        ? "font-black"
                        : "font-semibold text-slate-700"
                    }
                  >
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dica de Atendimento Pontual */}
          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1.5 font-bold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Atendimento com Horário Marcado</span>
            </p>
            <p className="leading-snug">
              Evite esperas desnecessárias agendando seu atendimento online com antecedência.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
