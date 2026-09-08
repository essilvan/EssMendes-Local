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
      className={`${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-8 shadow-sm space-y-6`}
    >
      {/* Cabeçalho da Seção */}
      <div className={`border-b ${currentTheme.borderClass} pb-4`}>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sobre o Espaço & Diferenciais</span>
        </div>
        <h2 className={`mt-1.5 text-lg sm:text-xl font-black ${currentTheme.textPrimary}`}>
          Comodidades & Diferenciais
        </h2>
        <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
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
              className={`flex flex-col space-y-3 p-4 sm:p-5 ${currentTheme.roundedClass} border ${currentTheme.borderClass} ${
                currentTheme.isDark ? "bg-zinc-800/60" : "bg-slate-50/70"
              } transition hover:shadow-2xs`}
            >
              {/* Título da Categoria */}
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                <h3 className={`text-xs sm:text-sm font-bold ${currentTheme.textPrimary} tracking-tight`}>
                  {category.title}
                </h3>
              </div>

              {/* Lista fluida de tags/chips com badges arredondados */}
              <div className="flex flex-wrap gap-2 pt-1">
                {category.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-2xs transition hover:bg-emerald-100/90"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
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
