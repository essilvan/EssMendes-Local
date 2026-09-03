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
      <section
        className="text-white pt-12 pb-12 mt-12 shadow-lg transition-colors"
        style={{
          backgroundColor: "var(--primary-color, #0d9488)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          
          {/* Topo com Botões de Ação Rápida */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-center">
          
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
        </div>
      </section>

      {/* Rodapé das Vitrines Públicas - Selo EssMendes Tecnologia */}
      <footer className="w-full py-8 border-t border-zinc-800/60 bg-[#07080a] text-center pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} {tenantName}. Todos os direitos reservados.
          </p>

          {/* Selo EssMendes Tecnologia */}
          <a
            href="https://essmendes.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/60 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group"
          >
            <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200">
              Plataforma & Presença Digital por
            </span>
            <Image
              src="/images/logo-essmendes.png"
              alt="EssMendes Tecnologia"
              width={160}
              height={50}
              className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Crie a Sua ↗
            </span>
          </a>
        </div>
      </footer>
    </>
  );
}
