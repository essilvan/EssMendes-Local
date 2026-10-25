"use client";

import React from "react";
import {
  Award,
  Clock,
  ShieldCheck,
  MessageSquare,
  Dog,
  Cat,
  Bone,
  PawPrint,
  Cake,
  Cookie,
  Cherry,
  Sparkles,
  CarFront,
  Wrench,
  Gauge,
  Cog,
  Disc,
  UtensilsCrossed,
  Flame,
  Wine,
  Soup,
  Coffee,
} from "lucide-react";
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
  const isPetShop = currentTheme?.id === "petshop";
  const isConfectionery = currentTheme?.id === "confeitaria" || currentTheme?.id === "bakery" || currentTheme?.id === "confectionery";
  const isAutomotive = currentTheme?.id === "automotive" || currentTheme?.id === "automotivo" || currentTheme?.id === "auto";
  const isRestaurant = currentTheme?.id === "restaurant" || currentTheme?.id === "gastronomia" || currentTheme?.id === "food";

  const pillars = isPetShop
    ? [
        {
          icon: Dog,
          title: "Banho & Tosa Humanizada",
          description: "Estética com carinho, paciência e sem traumas para o pet.",
          animationClass: "animate-tail-wag",
        },
        {
          icon: Cat,
          title: "Espaço Cat-Friendly",
          description: "Ambiente tranquilo e dedicado para o bem-estar de felinos.",
          animationClass: "animate-paw-float",
        },
        {
          icon: Bone,
          title: "Mimos & Nutrição Pet",
          description: "Petiscos selecionados, brinquedos seguros e mimos.",
          animationClass: "animate-tail-wag",
        },
        {
          icon: PawPrint,
          title: "Amor & Respeito Animal",
          description: "Profissionais certificados e apaixonados por bichinhos.",
          animationClass: "animate-paw-pulse",
        },
      ]
    : isConfectionery
    ? [
        {
          icon: Cake,
          title: "Receitas Artesanais",
          description: "Massas frescas, recheios nobres e sabor inigualável.",
          animationClass: "animate-sweet-float",
        },
        {
          icon: Cookie,
          title: "Ingredientes Nobres",
          description: "Chocolates puros, frutas frescas e baunilha natural.",
          animationClass: "animate-sparkle-twinkle",
        },
        {
          icon: Cherry,
          title: "Design Personalizado",
          description: "Bolos e doces customizados para sua festa ou celebração.",
          animationClass: "animate-sweet-float",
        },
        {
          icon: Sparkles,
          title: "Frescor & Pontualidade",
          description: "Produção sob encomenda entregue no ponto perfeito.",
          animationClass: "animate-sparkle-twinkle",
        },
      ]
    : isAutomotive
    ? [
        {
          icon: CarFront,
          title: "Linha Leve & Pesada",
          description: "Revisão geral preventiva e atendimento com padrão técnico.",
          animationClass: "",
        },
        {
          icon: Wrench,
          title: "Mecânica de Precisão",
          description: "Ferramental calibrado e profissionais experientes.",
          animationClass: "animate-wrench-tilt",
        },
        {
          icon: Gauge,
          title: "Diagnóstico Avançado",
          description: "Escaneamento computadorizado e medição precisa em tempo real.",
          animationClass: "animate-gauge-needle",
        },
        {
          icon: Disc,
          title: "Freios & Suspensão",
          description: "Discos ventilados e peças certificadas com garantia total.",
          animationClass: "animate-disc-spin",
        },
      ]
    : isRestaurant
    ? [
        {
          icon: UtensilsCrossed,
          title: "Gastronomia Autoral",
          description: "Receitas especiais com preparo minucioso e apresentação requintada.",
          animationClass: "animate-culinary-float",
        },
        {
          icon: Flame,
          title: "Brasa & Fogo Lento",
          description: "Carnes e pratos preparados no ponto exato para realçar o sabor.",
          animationClass: "animate-flame-flicker",
        },
        {
          icon: Wine,
          title: "Harmonização & Vinhos",
          description: "Rótulos selecionados para acompanhar a melhor experiência.",
          animationClass: "animate-culinary-float",
        },
        {
          icon: Soup,
          title: "Ingredientes Frescos",
          description: "Insumos selecionados e receitas aromáticas preparadas com paixão.",
          animationClass: "animate-steam-drift",
        },
      ]
    : [
        {
          icon: Award,
          title: "Atendimento de Excelência",
          description: "Profissionais qualificados e compromisso com o cliente.",
          animationClass: "",
        },
        {
          icon: Clock,
          title: "Sem Filas",
          description: "Atendimento com horário marcado e pontualidade.",
          animationClass: "",
        },
        {
          icon: ShieldCheck,
          title: "Qualidade Comprovada",
          description: "Procedimentos e serviços de alto padrão.",
          animationClass: "",
        },
        {
          icon: MessageSquare,
          title: "Transparência Total",
          description: "Clareza nos serviços antes da execução.",
          animationClass: "",
        },
      ];

  return (
    <section className={`relative overflow-hidden rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xl shadow-black/5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-neutral-300 dark:before:via-white/20 before:to-transparent`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`group flex items-start gap-4 p-4.5 rounded-2xl border border-neutral-200/70 dark:border-white/10 ${
                currentTheme.isDark ? 'bg-neutral-900/80 hover:bg-neutral-900' : 'bg-white/90 hover:bg-white'
              } backdrop-blur-md shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 mt-0.5"
                style={{
                  backgroundColor: "var(--brand-primary, #0d9488)",
                  boxShadow: "0 6px 16px -4px rgba(0,0,0,0.25)",
                }}
              >
                <Icon className={`h-5 w-5 ${item.animationClass || ""}`} />
              </div>
              <div className="space-y-1">
                <h3 className={`text-xs sm:text-sm font-extrabold ${currentTheme.textPrimary} leading-snug tracking-tight`}>
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
