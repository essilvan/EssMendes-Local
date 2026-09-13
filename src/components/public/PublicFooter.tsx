"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Clock,
  MessageCircle,
  Sparkles,
  Navigation,
} from "lucide-react";
import { generateWhatsAppUrl, sanitizePhoneNumber } from "@/utils/phone";
import { getBusinessStatus } from "@/utils/opening-hours";

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

  const status = openingHours
    ? getBusinessStatus(openingHours)
    : {
        isOpen: isOpenNow ?? false,
        badgeText: statusBadgeText || (isOpenNow ? "Aberto agora" : "Fechado no momento"),
        subText: statusDetailText || (isOpenNow ? "Atendimento Normal" : "Consulte horários"),
        label: statusBadgeText || (isOpenNow ? "Aberto agora" : "Fechado no momento"),
        subLabel: statusDetailText || (isOpenNow ? "Atendimento Normal" : "Consulte horários"),
      };

  return (
    <>
      <section className="bg-neutral-900 text-neutral-200 border-t border-neutral-800 py-12 sm:py-16 mt-16 shadow-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          
          {/* Topo com Botões de Ação Rápida */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 items-center">
          
          {/* Ação 1: Ligar Agora */}
          {phoneWhatsapp ? (
            <a
              href={`tel:+55${cleanPhone}`}
              className="flex items-center gap-3.5 rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-xs">
                <Phone className="h-5 w-5 text-neutral-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-400">
                  Ligar Agora
                </p>
                <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                  {phoneWhatsapp}
                </p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 border border-white/10 p-5">
              <Phone className="h-5 w-5 text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-300">Atendimento Presencial</span>
            </div>
          )}

          {/* Ação 2: Chamar no WhatsApp */}
          {phoneWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-400">
                  Chamar no WhatsApp
                </p>
                <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                  Conversar Agora
                </p>
              </div>
            </a>
          )}

          {/* Ação 3: Horário de Atendimento */}
          <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 border border-white/10 p-5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${
                status.isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status.isOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span>{status.label}</span>
              </p>
              <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                {status.subLabel}
              </p>
            </div>
          </div>

          {/* Ação 4: Como Chegar */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-xs">
              <Navigation className="h-5 w-5 text-neutral-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-400">
                Como Chegar
              </p>
              <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                {displayAddress}
              </p>
            </div>
          </a>

          </div>
        </div>
      </section>

      {/* Rodapé das Vitrines Públicas - Selo EssMendes Tecnologia */}
      <footer className="w-full py-8 border-t border-neutral-800/80 bg-neutral-950 text-center pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} {tenantName}. Todos os direitos reservados.
          </p>

          {/* Selo EssMendes Tecnologia */}
          <a
            href="https://essmendes.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-850 transition-all group"
          >
            <span className="text-[11px] text-neutral-400 group-hover:text-neutral-200">
              Plataforma & Presença Digital por
            </span>
            <Image
              src="/images/logo-essmendes.png"
              alt="EssMendes Tecnologia"
              width={160}
              height={50}
              className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Crie a Sua ↗
            </span>
          </a>
        </div>
      </footer>
    </>
  );
}
