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
    <section id="sobre" className={`${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-8 lg:p-10 space-y-6`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado Esquerdo: Descrição & História (7 Colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: "var(--primary-alpha-10, rgba(13, 148, 136, 0.1))",
              color: "var(--primary-color, #0d9488)",
            }}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Sobre o Estabelecimento</span>
          </div>

          <h2 className={`text-xl sm:text-2xl font-black ${currentTheme.textPrimary} leading-tight`}>
            Compromisso com a Excelência e Satisfação dos Clientes
          </h2>

          <div className={`space-y-2.5 text-xs sm:text-sm ${currentTheme.textMuted} leading-relaxed font-normal`}>
            <p>{mainText || defaultDescription}</p>
            {secondaryText && <p className={currentTheme.textMuted}>{secondaryText}</p>}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-3 text-xs font-black text-white shadow-md hover:opacity-95 active:scale-95 transition"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar um Horário</span>
            </button>

            {phoneWhatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 sm:px-5 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 transition shadow-2xs"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>Tirar Dúvidas no WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Lado Direito: 4 Pilares de Confiança Contextuais (5 Colunas) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-1.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Horário Marcado</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Atendimento pontual sem filas ou tempo de espera desnecessário.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-1.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Qualidade & Compromisso</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Serviços executados com excelência, atenção aos detalhes e foco no cliente.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-1.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Ambiente Confortável</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Instalações preparadas para proporcionar o seu bem-estar.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-1.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Fácil Acesso</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Localização conveniente e facilidade de chegada para você.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
