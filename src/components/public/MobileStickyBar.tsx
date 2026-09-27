"use client";

import React from "react";
import { MessageCircle, Calendar, MapPin, Phone } from "lucide-react";
import { generateWhatsAppUrl, sanitizePhoneNumber } from "@/utils/phone";
import { recordAnalyticsEvent } from "@/actions/analytics";
import type { NicheThemeConfig } from "@/config/tenant-themes";

interface MobileStickyBarProps {
  tenantId: string;
  tenantName: string;
  phoneWhatsapp?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
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
  placeId,
  googleMapsUrl,
  brandColor,
  onOpenBooking,
}: MobileStickyBarProps) {
  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", tenantName);
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${tenantName}, ${address || ""}`
  )}${placeId ? `&destination_place_id=${placeId}` : ""}`;
  const locationUrl =
    directionsUrl ||
    googleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          address || tenantName
        )}`);

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
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 z-40 md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        {/* Botão de Atalho Rápido: Localização */}
        <a
          href={locationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLocationClick}
          className="flex items-center justify-center h-11 w-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 shadow-xs active:scale-95 transition-all"
          title="Ver localização no mapa"
        >
          <MapPin className="h-5 w-5" />
        </a>

        {/* Botão de Atalho Rápido: WhatsApp */}
        {phoneWhatsapp && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="flex items-center justify-center h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 shadow-xs active:scale-95 transition-all"
            title="Conversar diretamente no WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}

        {/* Botão Largo com cor de destaque: Agendar Horário Online */}
        <button
          type="button"
          onClick={handleBookingClick}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-extrabold text-white shadow-md active:scale-98 transition-all duration-200 cursor-pointer"
          style={{
            backgroundColor: brandColor || "var(--brand-primary, #0d9488)",
          }}
        >
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Agendar Horário Online</span>
        </button>
      </div>
    </div>
  );
}
