"use client";

import React from "react";
import Link from "next/link";
import {
  Phone,
  Clock,
  MessageCircle,
  Sparkles,
  Navigation,
} from "lucide-react";
import { generateWhatsAppUrl, sanitizePhoneNumber } from "@/utils/phone";

interface PublicFooterProps {
  tenantName: string;
  phoneWhatsapp?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: any;
  isOpenNow?: boolean;
  statusBadgeText?: string;
  statusDetailText?: string;
  googleMapsUrl?: string | null;
  onOpenBooking: () => void;
}

export function PublicFooter({
  tenantName,
  phoneWhatsapp,
  address,
  latitude,
  longitude,
  openingHours,
  isOpenNow,
  statusBadgeText,
  statusDetailText,
  googleMapsUrl: customGoogleMapsUrl,
  onOpenBooking,
}: PublicFooterProps) {
  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", tenantName);
  const displayAddress = address || "Atendimento Presencial";
  
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const googleMapsUrl =
    customGoogleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`);

  const { getBusinessStatus } = require("@/utils/opening-hours");
  const status = openingHours
    ? getBusinessStatus(openingHours)
    : {
        isOpen: isOpenNow ?? true,
        label: statusBadgeText || (isOpenNow ? "Aberto agora" : "Fechado no momento"),
        subLabel: statusDetailText || (isOpenNow ? "Atendimento Normal" : "Consulte horários"),
      };

  return (
    <footer
      className="text-white pt-12 pb-24 sm:pb-12 mt-12 shadow-lg transition-colors"
      style={{
        backgroundColor: "var(--primary-color, #0d9488)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        
        {/* Topo do Footer com Botões de Ação Rápida */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-center border-b border-white/20 pb-8">
          
          {/* Ação 1: Ligar Agora */}
          {phoneWhatsapp ? (
            <a
              href={`tel:+55${cleanPhone}`}
              className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur-xs hover:bg-white/25 transition shadow-2xs"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-xs">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider text-white/80">
                  Ligar Agora
                </p>
                <p className="text-xs sm:text-sm font-black text-white truncate">
                  {phoneWhatsapp}
                </p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur-xs">
              <Phone className="h-5 w-5 text-white" />
              <span className="text-xs font-bold">Atendimento Presencial</span>
            </div>
          )}

          {/* Ação 2: Chamar no WhatsApp */}
          {phoneWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur-xs hover:bg-white/25 transition shadow-2xs"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider text-white/80">
                  Chamar no WhatsApp
                </p>
                <p className="text-xs sm:text-sm font-black text-white">
                  Conversar Agora
                </p>
              </div>
            </a>
          )}

          {/* Ação 3: Horário de Atendimento */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur-xs">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-950 shadow-xs ${
                status.isOpen ? "bg-emerald-400" : "bg-amber-400"
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] uppercase font-black tracking-wider text-white/80 flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status.isOpen ? "bg-emerald-300 animate-pulse" : "bg-amber-300"
                  }`}
                />
                <span>{status.label}</span>
              </p>
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {status.subLabel}
              </p>
            </div>
          </div>

          {/* Ação 4: Como Chegar */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur-xs hover:bg-white/25 transition shadow-2xs"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-xs">
              <Navigation className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] uppercase font-black tracking-wider text-white/80">
                Como Chegar
              </p>
              <p className="text-xs font-black text-white truncate">
                {displayAddress}
              </p>
            </div>
          </a>

        </div>

        {/* Linha Inferior: Branding e Direitos */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/85 pt-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">
              {tenantName}
            </span>
            <span>•</span>
            <span className="text-white/70">
              © {new Date().getFullYear()} Todos os direitos reservados.
            </span>
          </div>

          <div className="flex items-center gap-1 text-white/95">
            <span>Presença Digital por</span>
            <Link
              href="/"
              className="font-black text-white hover:underline inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs"
            >
              <Sparkles className="h-3 w-3" />
              EssMendes Local
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
