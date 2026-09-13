"use client";

import React from "react";
import { MessageCircle, Calendar, Phone, MapPin, Clock } from "lucide-react";
import { generateWhatsAppUrl, sanitizePhoneNumber } from "@/utils/phone";
import { recordAnalyticsEvent } from "@/actions/analytics";
import { getBusinessStatus } from "@/utils/opening-hours";
import type { NicheThemeConfig } from "@/config/tenant-themes";

interface MobileStickyBarProps {
  tenantId: string;
  tenantName: string;
  phoneWhatsapp?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  openingHours?: any;
  isOpenNow?: boolean;
  statusBadgeText?: string;
  statusDetailText?: string;
  theme?: NicheThemeConfig;
  activeTemplate?: string;
  brandColor?: string;
  onOpenBooking: () => void;
}

export function MobileStickyBar({
  tenantId,
  tenantName,
  phoneWhatsapp,
  address,
  latitude,
  longitude,
  googleMapsUrl,
  openingHours,
  isOpenNow,
  statusBadgeText,
  statusDetailText,
  theme,
  activeTemplate,
  brandColor,
  onOpenBooking,
}: MobileStickyBarProps) {
  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", tenantName);
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const locationUrl =
    googleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          address || tenantName
        )}`);

  const status = openingHours
    ? getBusinessStatus(openingHours)
    : {
        isOpen: isOpenNow ?? false,
        badgeText: statusBadgeText || (isOpenNow ? "Aberto agora" : "Fechado no momento"),
        subText: statusDetailText || (isOpenNow ? "Atendimento Normal" : "Consulte horários"),
        label: statusBadgeText || (isOpenNow ? "Aberto agora" : "Fechado no momento"),
        subLabel: statusDetailText || (isOpenNow ? "Atendimento Normal" : "Consulte horários"),
      };

  const handlePhoneClick = () => {
    recordAnalyticsEvent(tenantId, "click_phone", "mobile");
  };

  const handleWhatsAppClick = () => {
    recordAnalyticsEvent(tenantId, "click_whatsapp", "mobile");
  };

  const handleLocationClick = () => {
    recordAnalyticsEvent(tenantId, "click_directions", "mobile");
  };

  const handleBookingClick = () => {
    recordAnalyticsEvent(tenantId, "click_booking", "mobile");
    onOpenBooking();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-neutral-200/80 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl px-3.5 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      {/* Card de Status Dinâmico de Horários do Google Maps */}
      <div
        className={`text-[11px] font-semibold py-1 px-3 mb-2 rounded-xl flex items-center justify-between gap-2 border ${
          status.isOpen
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        }`}
      >
        <span className="flex items-center gap-1.5 font-bold shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${
              status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{status.badgeText || status.label}</span>
        </span>
        <span className="text-neutral-500 dark:text-neutral-400 truncate text-[10px] font-medium">{status.subText || status.subLabel}</span>
      </div>

      {activeTemplate === "conversion" ? (
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {cleanPhone && (
            <a
              href={`tel:+55${cleanPhone}`}
              onClick={handlePhoneClick}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-100 dark:bg-white/5 py-3 px-3 text-xs font-semibold text-neutral-800 dark:text-neutral-200 active:scale-95 transition-all shrink-0 shadow-xs"
              title="Ligar para o estabelecimento"
            >
              <Phone className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              <span className="text-[10px]">Ligar</span>
            </a>
          )}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5 fill-white text-emerald-600 shrink-0" />
            <span>Falar no WhatsApp Agora</span>
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {/* Botão Ligar */}
          {cleanPhone && (
            <a
              href={`tel:+55${cleanPhone}`}
              onClick={handlePhoneClick}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-100 dark:bg-white/5 py-2 px-2.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all shrink-0"
              title="Ligar para o estabelecimento"
            >
              <Phone className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              <span>Ligar</span>
            </a>
          )}

          {/* Botão WhatsApp */}
          {phoneWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 px-3 text-[10px] font-bold text-white shadow-xs active:scale-95 transition-all shrink-0"
              title="Conversar no WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          )}

          {/* Botão Localização */}
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLocationClick}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-100 dark:bg-white/5 py-2 px-2.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all shrink-0"
            title="Ver no mapa / como chegar"
          >
            <MapPin className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span>Mapa</span>
          </a>

          {/* Botão Principal: Agendar Horário */}
          <button
            type="button"
            onClick={handleBookingClick}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold text-white shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: brandColor || "var(--brand-primary, #0d9488)",
            }}
          >
            <Calendar className="h-4 w-4" />
            <span>Agendar</span>
          </button>
        </div>
      )}
    </div>
  );
}
