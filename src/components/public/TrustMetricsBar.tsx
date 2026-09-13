"use client";

import React from "react";
import { Award, Clock, ShieldCheck, MessageSquare } from "lucide-react";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface TrustMetricsBarProps {
  rating?: number | null;
  reviewCount?: number | null;
  businessCategory?: string | null;
  theme?: NicheThemeConfig;
}

export function TrustMetricsBar({ theme }: TrustMetricsBarProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;

  const pillars = [
    {
      icon: Award,
      title: "Atendimento de Excelência",
      description: "Profissionais qualificados e compromisso com o cliente.",
    },
    {
      icon: Clock,
      title: "Sem Filas",
      description: "Atendimento com horário marcado e pontualidade.",
    },
    {
      icon: ShieldCheck,
      title: "Qualidade Comprovada",
      description: "Procedimentos e serviços de alto padrão.",
    },
    {
      icon: MessageSquare,
      title: "Transparência Total",
      description: "Clareza nos serviços antes da execução.",
    },
  ];

  return (
    <section className={`rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xl shadow-black/5`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 ${
                currentTheme.isDark ? 'bg-neutral-900/80' : 'bg-white/95'
              } backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs mt-0.5"
                style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-xs sm:text-sm font-bold ${currentTheme.textPrimary} leading-snug`}>
                  {item.title}
                </h3>
                <p className={`text-xs ${currentTheme.textMuted} leading-relaxed font-normal`}>
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
