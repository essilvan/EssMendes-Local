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
  isOpenNow: boolean;
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

  const badgeLabel = statusBadgeText || (isOpenNow ? "Aberto agora" : "Fechado no momento");
  const detailLabel = statusDetailText || (isOpenNow ? "Atendimento até às 18:00" : "Abre amanhã às 08:00");

  return (
    <header className="w-full relative z-40">
      {/* 1. Top Bar Utilitária Escura/Neutra (Padrão Applewood) */}
      <div className="bg-slate-950 text-slate-300 border-b border-slate-800/90 text-xs py-2 px-4 shadow-inner">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          
          {/* Lado Esquerdo: Endereço Físico Formatado */}
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <a
              href="#contato"
              className="text-slate-300 hover:text-white transition truncate font-medium max-w-[220px] sm:max-w-xs md:max-w-md"
              title={displayAddress}
            >
              {cleanNeighborhood}
            </a>
          </div>

          {/* Centro: Status Dinâmico de Funcionamento */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-wide ring-1 ${
                isOpenNow
                  ? "bg-emerald-950/80 text-emerald-300 ring-emerald-500/30"
                  : "bg-amber-950/80 text-amber-300 ring-amber-500/30"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOpenNow ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>{badgeLabel}</span>
            </span>

            <span className="hidden sm:inline text-slate-400 text-xs font-medium">
              — {detailLabel}
            </span>
          </div>

          {/* Lado Direito: Telefone de Contato + Rotas GPS */}
          <div className="flex items-center gap-3">
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
                className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white font-bold transition lg:border-l lg:border-slate-800 lg:pl-3"
              >
                <Phone className="h-3 w-3 text-slate-400" />
                <span>{phoneWhatsapp}</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* 2. Navbar Suspensa com Logo, Âncoras e Botão de Agendamento */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Nome da Empresa */}
          <Link
            href={`/${tenantSlug}`}
            className="flex items-center gap-3 group shrink-0"
          >
            <div
              className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-white font-black text-sm shadow-sm overflow-hidden"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`Logotipo de ${tenantName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{tenantName.substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-slate-700 transition truncate max-w-[180px] sm:max-w-[260px]">
                  {tenantName}
                </span>
                <ShieldCheck
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--primary-color, #0d9488)" }}
                />
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                Presença Oficial & Agendamento
              </p>
            </div>
          </Link>

          {/* Links de Ancoragem Desktop */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
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
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:opacity-95 active:scale-95 cursor-pointer"
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
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
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
