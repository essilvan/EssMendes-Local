"use client";

import React from "react";
import type { Service } from "@/types";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";
import { getServiceIcon, formatCurrency } from "@/utils/showcase";
import { Award, Clock, ShieldCheck, MessageSquare, Sparkles } from "lucide-react";

interface TrustMetricsBarProps {
  rating?: number | null;
  reviewCount?: number | null;
  businessCategory?: string | null;
  theme?: NicheThemeConfig;
  services?: Service[];
  tenant?: any;
  onSelectService?: (serviceId?: string) => void;
}

export function TrustMetricsBar({
  businessCategory,
  theme,
  services = [],
  tenant,
  onSelectService,
}: TrustMetricsBarProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;

  // 1. Tentar renderizar a partir dos serviços reais cadastrados no Supabase
  const activeServices = (tenant?.services || services || []).filter(Boolean);

  if (activeServices.length > 0) {
    const displayedServices = activeServices.slice(0, 4);

    return (
      <section
        className={`relative overflow-hidden rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xl shadow-black/5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-neutral-300 dark:before:via-white/20 before:to-transparent`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {displayedServices.map((service: Service) => {
            const Icon = getServiceIcon(service.name, currentTheme?.id);
            const hasPrice = service.price !== null && Number(service.price) > 0;
            const priceTag = hasPrice ? formatCurrency(Number(service.price)) : null;
            const durationTag = service.duration_minutes ? `${service.duration_minutes} min` : null;
            const tag = priceTag || durationTag;

            return (
              <div
                key={service.id}
                onClick={() => onSelectService?.(service.id)}
                className={`group flex items-start gap-4 p-4.5 rounded-2xl border border-neutral-200/70 dark:border-white/10 ${
                  currentTheme.isDark
                    ? "bg-neutral-900/80 hover:bg-neutral-900"
                    : "bg-white/90 hover:bg-white"
                } backdrop-blur-md shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 mt-0.5"
                  style={{
                    backgroundColor: "var(--brand-primary, #0d9488)",
                    boxShadow: "0 6px 16px -4px rgba(0,0,0,0.25)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs sm:text-sm font-extrabold ${currentTheme.textPrimary} leading-snug tracking-tight truncate`}
                      title={service.name}
                    >
                      {service.name}
                    </h3>
                    {tag && (
                      <span className="shrink-0 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {tag}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${currentTheme.textMuted} leading-relaxed font-normal line-clamp-2`}
                  >
                    {service.description ||
                      "Atendimento especializado com alto padrão de qualidade e dedicação."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // 2. Se não houver serviços, verificar diferenciais do tenant cadastrados no banco (tenant.highlights)
  if (Array.isArray(tenant?.highlights) && tenant.highlights.length > 0) {
    const rawHighlights = tenant.highlights.slice(0, 4);
    return (
      <section
        className={`relative overflow-hidden rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xl shadow-black/5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-neutral-300 dark:before:via-white/20 before:to-transparent`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {rawHighlights.map((item: any, idx: number) => {
            const title = typeof item === "string" ? item : item?.title || item?.name || `Diferencial ${idx + 1}`;
            const desc = typeof item === "object" ? item?.desc || item?.description : "Atendimento diferenciado com foco no cliente.";
            const Icon = getServiceIcon(title, currentTheme?.id);

            return (
              <div
                key={idx}
                className={`group flex items-start gap-4 p-4.5 rounded-2xl border border-neutral-200/70 dark:border-white/10 ${
                  currentTheme.isDark
                    ? "bg-neutral-900/80 hover:bg-neutral-900"
                    : "bg-white/90 hover:bg-white"
                } backdrop-blur-md shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 mt-0.5"
                  style={{
                    backgroundColor: "var(--brand-primary, #0d9488)",
                    boxShadow: "0 6px 16px -4px rgba(0,0,0,0.25)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3
                    className={`text-xs sm:text-sm font-extrabold ${currentTheme.textPrimary} leading-snug tracking-tight truncate`}
                  >
                    {title}
                  </h3>
                  <p
                    className={`text-xs ${currentTheme.textMuted} leading-relaxed font-normal line-clamp-2`}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // 3. Fallback contextual verdadeiro derivado da categoria real do estabelecimento
  const actualCategory = businessCategory || tenant?.category;
  const contextualCards = [
    {
      icon: Sparkles,
      title: actualCategory ? `Especialidade em ${actualCategory}` : "Atendimento de Excelência",
      description: "Serviços e produtos selecionados para oferecer a melhor experiência.",
    },
    {
      icon: Clock,
      title: "Horário Agendado",
      description: "Atendimento com agendamento ágil e pontualidade para o seu conforto.",
    },
    {
      icon: ShieldCheck,
      title: "Garantia & Confiança",
      description: "Transparência total e compromisso com o melhor resultado.",
    },
    {
      icon: Award,
      title: "Qualidade Comprovada",
      description: "Reconhecimento positivo e dedicação contínua em cada atendimento.",
    },
  ];

  return (
    <section
      className={`relative overflow-hidden rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xl shadow-black/5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-neutral-300 dark:before:via-white/20 before:to-transparent`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {contextualCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`group flex items-start gap-4 p-4.5 rounded-2xl border border-neutral-200/70 dark:border-white/10 ${
                currentTheme.isDark
                  ? "bg-neutral-900/80 hover:bg-neutral-900"
                  : "bg-white/90 hover:bg-white"
              } backdrop-blur-md shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 mt-0.5"
                style={{
                  backgroundColor: "var(--brand-primary, #0d9488)",
                  boxShadow: "0 6px 16px -4px rgba(0,0,0,0.25)",
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3
                  className={`text-xs sm:text-sm font-extrabold ${currentTheme.textPrimary} leading-snug tracking-tight truncate`}
                >
                  {item.title}
                </h3>
                <p
                  className={`text-xs ${currentTheme.textMuted} leading-relaxed font-normal line-clamp-2`}
                >
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
