"use client";

import React from "react";
import {
  Utensils,
  Coffee,
  Sparkles,
  Heart,
  Check,
  Building,
  Wifi,
} from "lucide-react";
import type { BusinessAttributes as BusinessAttributesType } from "@/types";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface BusinessAttributesProps {
  attributes?: BusinessAttributesType | null;
  theme?: NicheThemeConfig;
}

const CATEGORY_CONFIG = [
  {
    key: "menu_options",
    title: "Opções de Cardápio",
    icon: Coffee,
  },
  {
    key: "dining_options",
    title: "Refeições & Serviços",
    icon: Utensils,
  },
  {
    key: "amenities",
    title: "Comodidades & Conforto",
    icon: Wifi,
  },
  {
    key: "atmosphere",
    title: "Ambiente & Experiência",
    icon: Heart,
  },
];

export function BusinessAttributes({
  attributes,
  theme,
}: BusinessAttributesProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;

  if (!attributes) return null;

  // Monta lista de categorias com itens reais
  const activeCategories = CATEGORY_CONFIG.map((cat) => ({
    key: cat.key,
    title: cat.title,
    icon: cat.icon,
    items: Array.isArray(attributes[cat.key])
      ? (attributes[cat.key] as string[]).filter((i) => Boolean(i && i.trim()))
      : [],
  })).filter((cat) => cat.items.length > 0);

  // Considera também categorias dinâmicas extras se houverem no JSONB
  const knownKeys = new Set(CATEGORY_CONFIG.map((c) => c.key));
  Object.keys(attributes).forEach((key) => {
    if (!knownKeys.has(key) && Array.isArray(attributes[key])) {
      const items = (attributes[key] as string[]).filter((i) => Boolean(i && i.trim()));
      if (items.length > 0) {
        activeCategories.push({
          key,
          title: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          icon: Building,
          items,
        });
      }
    }
  });

  // Ocultar suavemente se todas as categorias estiverem vazias
  if (activeCategories.length === 0) {
    return null;
  }

  const gridColsClass =
    activeCategories.length > 2
      ? "md:grid-cols-2 lg:grid-cols-4"
      : activeCategories.length === 2
      ? "md:grid-cols-2"
      : "grid-cols-1";

  return (
    <section
      id="comodidades"
      className={`rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-7 sm:p-10 shadow-xl shadow-black/5 space-y-8`}
    >
      {/* Cabeçalho da Seção */}
      <div className={`border-b border-neutral-200/80 dark:border-white/10 pb-6`}>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sobre o Espaço & Diferenciais</span>
        </div>
        <h2 className={`mt-2 text-xl sm:text-2xl font-extrabold ${currentTheme.textPrimary} tracking-tight`}>
          Comodidades & Diferenciais
        </h2>
        <p className={`text-xs sm:text-sm ${currentTheme.textMuted} mt-1`}>
          Características, ambiente e facilidades disponíveis para sua maior comodidade e conveniência.
        </p>
      </div>

      {/* Grid Responsivo (Desktop: 2 a 4 colunas bem distribuídas; Mobile: Lista fluida de tags com badges arredondados) */}
      <div className={`grid grid-cols-1 ${gridColsClass} gap-5 sm:gap-6`}>
        {activeCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.key}
              className={`flex flex-col space-y-4 p-5 sm:p-6 rounded-2xl border border-neutral-200/80 dark:border-white/10 ${
                currentTheme.isDark ? "bg-neutral-900/80" : "bg-white/95"
              } backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            >
              {/* Título da Categoria */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--brand-primary, #0d9488)" }}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                <h3 className={`text-sm sm:text-base font-bold ${currentTheme.textPrimary} tracking-tight`}>
                  {category.title}
                </h3>
              </div>

              {/* Lista fluida de tags/chips com badges arredondados */}
              <div className="flex flex-wrap gap-2 pt-1">
                {category.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BusinessAttributes;
