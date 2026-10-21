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
    <>
      {/* 1. Top Bar Utilitária Escura/Neutra (Padrão Applewood) */}
      <div className="bg-zinc-950 text-zinc-300 border-b border-white/10 text-xs py-2 px-4 shadow-inner w-full overflow-hidden">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 sm:gap-3 w-full">
          
          {/* Lado Esquerdo: Endereço Físico Formatado */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-full">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <a
              href="#contato"
              className="text-zinc-300 hover:text-white transition w-full truncate text-xs font-medium"
              title={displayAddress}
            >
              {cleanNeighborhood}
            </a>
          </div>

          {/* Centro: Status Dinâmico de Funcionamento */}
          <div className="flex items-center gap-2 text-xs min-w-0 max-w-full">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                status.isOpen
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {status.isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    status.isOpen ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-rose-400"
                  }`}
                />
              </span>
              <span>{status.badgeText}</span>
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
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1 text-[11px] font-bold text-zinc-200 transition border border-white/10"
                title="Abrir rota no Waze"
              >
                <span className="text-[10px] font-black text-cyan-400">W</span>
                <span>Waze</span>
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1 text-[11px] font-bold text-zinc-200 transition border border-white/10"
                title="Abrir rota no Google Maps"
              >
                <span className="text-[10px] font-black text-rose-400">G</span>
                <span>Maps</span>
              </a>
            </div>

            {/* Telefone Direto */}
            {phoneWhatsapp && (
              <a
                href={`tel:+55${cleanPhone}`}
                className="inline-flex items-center gap-1.5 text-zinc-200 hover:text-white font-semibold transition text-xs shrink-0 lg:border-l lg:border-zinc-800 lg:pl-3"
              >
                <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="w-full truncate text-xs">{phoneWhatsapp}</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* 2. Cabeçalho / Navbar Adesivo com Efeito de Vidro Fosco */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200/50 w-full transition-colors shadow-xs">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo & Nome da Empresa com Alinhamento Óptico Impecável */}
          <Link
            href={`/${tenantSlug}`}
            className="flex items-center gap-3 min-w-0 flex-1 group py-0.5"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`Logotipo de ${tenantName}`}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover shrink-0 border border-zinc-200/60 dark:border-white/10 shadow-xs group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-xs shrink-0 overflow-hidden group-hover:scale-105 transition-transform"
                style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
              >
                <span>{tenantName.substring(0, 2).toUpperCase()}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-sm sm:text-base tracking-tight truncate text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {tenantName}
              </span>
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-emerald-500"
                aria-label="Empresa Verificada"
              />
            </div>
          </Link>

          {/* Links de Ancoragem Desktop com Hover Pill Suave */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
            <a
              href="#servicos"
              className="px-3 py-1.5 rounded-xl hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              Serviços
            </a>
            <a
              href="#sobre"
              className="px-3 py-1.5 rounded-xl hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              Sobre
            </a>
            <a
              href="#fotos"
              className="px-3 py-1.5 rounded-xl hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              Ambiente
            </a>
            <a
              href="#avaliacoes"
              className="px-3 py-1.5 rounded-xl hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              Avaliações
            </a>
            <a
              href="#contato"
              className="px-3 py-1.5 rounded-xl hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              Horários & Contato
            </a>
          </div>

          {/* Botão de Ação Primária + Menu Hamburguer no Mobile */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto justify-end">
            <button
              type="button"
              onClick={onOpenBooking}
              className="hidden md:inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-shimmer"
              style={{
                backgroundColor: "var(--brand-primary, #0d9488)",
              }}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Agendar Atendimento</span>
            </button>

            {/* Toggle Menu Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition shrink-0 ml-auto"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

        </nav>

        {/* Menu Retrátil Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200/50 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 py-3 space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 animate-in slide-in-from-top-2 duration-150">
            <a
              href="#servicos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              Serviços
            </a>
            <a
              href="#sobre"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              Sobre a Empresa
            </a>
            <a
              href="#fotos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              Fotos & Instalações
            </a>
            <a
              href="#avaliacoes"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              Avaliações Google
            </a>
            <a
              href="#contato"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              Horários & Localização
            </a>
          </div>
        )}
      </header>
    </>
  );
}
