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
    <section className={`${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-8 space-y-4`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`flex items-start gap-3.5 p-3 ${currentTheme.roundedClass} ${
                currentTheme.isDark ? 'bg-zinc-800/60 border border-zinc-700/60' : 'bg-slate-50/70 border border-slate-100'
              } transition hover:scale-[1.01]`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs mt-0.5"
                style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className={`text-xs sm:text-sm font-black ${currentTheme.textPrimary} leading-snug`}>
                  {item.title}
                </h3>
                <p className={`text-[11px] sm:text-xs ${currentTheme.textMuted} leading-relaxed font-normal`}>
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
