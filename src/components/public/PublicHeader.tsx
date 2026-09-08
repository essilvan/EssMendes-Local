"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Calendar,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { sanitizePhoneNumber } from "@/utils/phone";
import { extractNeighborhoodAndCity } from "@/utils/address";
import { getBusinessStatus } from "@/utils/opening-hours";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PublicHeaderProps {
  tenantName: string;
  tenantSlug: string;
  logoUrl?: string | null;
  phoneWhatsapp?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: any;
  isOpenNow?: boolean;
  statusBadgeText?: string;
  statusDetailText?: string;
  theme?: NicheThemeConfig;
  onOpenBooking: () => void;
}

export function PublicHeader({
  tenantName,
  tenantSlug,
  logoUrl,
  phoneWhatsapp,
  address,
  latitude,
  longitude,
  openingHours,
  isOpenNow,
  statusBadgeText,
  statusDetailText,
  theme,
  onOpenBooking,
}: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentTheme = theme || NICHE_THEMES.retail_default;

  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";
  const displayAddress = address || "Atendimento Presencial";
  const cleanNeighborhood = extractNeighborhoodAndCity(address) || displayAddress;

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(displayAddress)}`;
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;

  const status = openingHours
    ? getBusinessStatus(openingHours)
    : {
        isOpen: isOpenNow ?? false,
        badgeText: statusBadgeText || (isOpenNow ? "Aberto agora" : "Fechado no momento"),
        subText: statusDetailText || "Consulte horários",
      };

  return (
    <header className="w-full relative z-40">
      {/* 1. Top Bar Utilitária Escura/Neutra (Padrão Applewood) */}
      <div className="bg-slate-950 text-slate-300 border-b border-slate-800/90 text-xs py-2 px-4 shadow-inner w-full overflow-hidden">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 sm:gap-3 w-full">
          
          {/* Lado Esquerdo: Endereço Físico Formatado */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-full">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <a
              href="#contato"
              className="text-slate-300 hover:text-white transition w-full truncate text-xs font-medium"
              title={displayAddress}
            >
              {cleanNeighborhood}
            </a>
          </div>

          {/* Centro: Status Dinâmico de Funcionamento */}
          <div className="flex items-center gap-2 text-xs min-w-0 max-w-full">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                status.isOpen
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                  : "bg-rose-950/80 text-rose-400 border border-rose-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {status.badgeText}
            </span>
            <span className="text-zinc-400 w-full truncate text-xs">— {status.subText}</span>
          </div>

          {/* Lado Direito: Telefone de Contato + Rotas GPS */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Atalhos Rápidos GPS */}
            <div className="hidden lg:flex items-center gap-1.5">
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-200 transition"
                title="Abrir rota no Waze"
              >
                <span className="text-[9px] font-black text-cyan-400">W</span>
                <span>Waze</span>
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-200 transition"
                title="Abrir rota no Google Maps"
              >
                <span className="text-[9px] font-black text-red-400">G</span>
                <span>Maps</span>
              </a>
            </div>

            {/* Telefone Direto */}
            {phoneWhatsapp && (
              <a
                href={`tel:+55${cleanPhone}`}
                className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white font-bold transition text-xs shrink-0 lg:border-l lg:border-slate-800 lg:pl-3"
              >
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="w-full truncate text-xs">{phoneWhatsapp}</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* 2. Navbar Suspensa com Logo, Âncoras e Botão de Agendamento */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo & Nome da Empresa */}
          <Link
            href={`/${tenantSlug}`}
            className="flex items-center gap-2 min-w-0 flex-1 group"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`Logotipo de ${tenantName}`}
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-white font-black text-xs shadow-sm shrink-0 overflow-hidden"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  <span>{tenantName.substring(0, 2).toUpperCase()}</span>
                </div>
              )}

              <span className="font-semibold text-sm truncate text-slate-900 group-hover:text-slate-700 transition">
                {tenantName}
              </span>
              <ShieldCheck
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--primary-color, #0d9488)" }}
              />
            </div>
          </Link>

          {/* Links de Ancoragem Desktop */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 shrink-0">
            <a
              href="#servicos"
              className="hover:text-slate-900 transition py-1 hover:border-b-2 hover:border-slate-900"
            >
              Serviços
            </a>
            <a
              href="#sobre"
              className="hover:text-slate-900 transition py-1 hover:border-b-2 hover:border-slate-900"
            >
              Sobre
            </a>
            <a
              href="#fotos"
              className="hover:text-slate-900 transition py-1 hover:border-b-2 hover:border-slate-900"
            >
              Ambiente
            </a>
            <a
              href="#avaliacoes"
              className="hover:text-slate-900 transition py-1 hover:border-b-2 hover:border-slate-900"
            >
              Avaliações
            </a>
            <a
              href="#contato"
              className="hover:text-slate-900 transition py-1 hover:border-b-2 hover:border-slate-900"
            >
              Horários & Contato
            </a>
          </div>

          {/* Botão de Ação Primária + Menu Hamburguer no Mobile */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto justify-end">
            <button
              type="button"
              onClick={onOpenBooking}
              className="hidden md:inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:opacity-95 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: "var(--primary-color, #0d9488)",
              }}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Agendar Atendimento</span>
            </button>

            {/* Toggle Menu Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shrink-0 ml-auto"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

        </div>

        {/* Menu Retrátil Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2 text-xs font-bold text-slate-700 animate-in slide-in-from-top-2 duration-150">
            <a
              href="#servicos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              Serviços
            </a>
            <a
              href="#sobre"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              Sobre a Empresa
            </a>
            <a
              href="#fotos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              Fotos & Instalações
            </a>
            <a
              href="#avaliacoes"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              Avaliações Google
            </a>
            <a
              href="#contato"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              Horários & Localização
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
