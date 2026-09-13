"use client";

import React from "react";
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Clock,
  MapPin,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { generateWhatsAppUrl } from "@/utils/phone";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface AboutBusinessSectionProps {
  tenantName: string;
  description?: string | null;
  editorialSummary?: string | null;
  address?: string | null;
  phoneWhatsapp?: string | null;
  businessCategory?: string | null;
  theme?: NicheThemeConfig;
  onOpenBooking: () => void;
}

export function AboutBusinessSection({
  tenantName,
  description,
  editorialSummary,
  address,
  phoneWhatsapp,
  businessCategory,
  theme,
  onOpenBooking,
}: AboutBusinessSectionProps) {
  const whatsappUrl = generateWhatsAppUrl(phoneWhatsapp || "", tenantName);

  const mainText = editorialSummary || description;
  const secondaryText =
    editorialSummary && description && editorialSummary !== description
      ? description
      : null;

  const defaultDescription = businessCategory
    ? `O ${tenantName} é referência em ${businessCategory.toLowerCase()} na região, oferecendo atendimento dedicado, pontualidade e serviços de alta qualidade para todos os clientes.`
    : `O ${tenantName} é referência na região pela qualidade do atendimento, pontualidade e dedicação aos seus clientes. Agende seu horário ou tire dúvidas online.`;

  const currentTheme = theme || NICHE_THEMES.retail_default;

  return (
    <section id="sobre" className={`rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-7 sm:p-10 lg:p-12 space-y-8 shadow-xl shadow-black/5`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Lado Esquerdo: Descrição & História (7 Colunas) */}
        <div className="lg:col-span-7 space-y-5">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Sobre o Estabelecimento</span>
          </div>

          <h2 className={`text-2xl sm:text-3xl font-extrabold ${currentTheme.textPrimary} tracking-tight leading-tight`}>
            Compromisso com a Excelência e Satisfação dos Clientes
          </h2>

          <div className={`space-y-3 text-xs sm:text-sm ${currentTheme.textMuted} leading-relaxed font-normal`}>
            <p>{mainText || defaultDescription}</p>
            {secondaryText && <p className={currentTheme.textMuted}>{secondaryText}</p>}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar um Horário</span>
            </button>

            {phoneWhatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200/70 dark:hover:bg-white/10 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xs"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tirar Dúvidas no WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Lado Direito: 4 Pilares de Confiança Contextuais (5 Colunas) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-5 space-y-2 shadow-sm hover:shadow-md transition-all duration-300">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
            >
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">Horário Marcado</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Atendimento pontual sem filas ou tempo de espera desnecessário.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-5 space-y-2 shadow-sm hover:shadow-md transition-all duration-300">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">Qualidade & Confiança</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Serviços executados com excelência, atenção aos detalhes e foco no cliente.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-5 space-y-2 shadow-sm hover:shadow-md transition-all duration-300">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">Ambiente Confortável</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Instalações preparadas para proporcionar o seu bem-estar total.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-md p-5 space-y-2 shadow-sm hover:shadow-md transition-all duration-300">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
            >
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">Fácil Acesso</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Localização conveniente e facilidade de chegada para você.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
