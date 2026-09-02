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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-lg px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {/* Card de Status Dinâmico de Horários do Google Maps */}
      <div
        className={`text-[11px] font-bold py-1 px-3 mb-1.5 rounded-lg flex items-center justify-between gap-2 shadow-2xs ${
          status.isOpen
            ? "bg-emerald-50 text-emerald-900 border border-emerald-200/80"
            : "bg-amber-50 text-amber-900 border border-amber-200/80"
        }`}
      >
        <span className="flex items-center gap-1.5 font-extrabold shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${
              status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{status.badgeText || status.label}</span>
        </span>
        <span className="text-slate-600 truncate text-[10px] font-medium">{status.subText || status.subLabel}</span>
      </div>

      <div className="flex items-center gap-1.5 max-w-lg mx-auto">
        {/* Botão Ligar */}
        {cleanPhone && (
          <a
            href={`tel:+55${cleanPhone}`}
            onClick={handlePhoneClick}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-[10px] font-bold text-slate-700 active:bg-slate-100 transition shrink-0"
            title="Ligar para o estabelecimento"
          >
            <Phone className="h-4 w-4 text-slate-600" />
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
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-emerald-600 py-1.5 px-3 text-[10px] font-bold text-white shadow-xs active:bg-emerald-700 transition shrink-0"
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
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-[10px] font-bold text-slate-700 active:bg-slate-100 transition shrink-0"
          title="Ver no mapa / como chegar"
        >
          <MapPin className="h-4 w-4 text-slate-600" />
          <span>Mapa</span>
        </a>

        {/* Botão Principal: Agendar Horário */}
        <button
          type="button"
          onClick={handleBookingClick}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-black text-white shadow-md active:scale-95 transition ${
            theme?.ctaButtonClass || "hover:opacity-95"
          }`}
          style={!theme?.ctaButtonClass ? { backgroundColor: "var(--primary-color, #0d9488)" } : undefined}
        >
          <Calendar className="h-4 w-4" />
          <span>Agendar</span>
        </button>
      </div>
    </div>
  );
}
