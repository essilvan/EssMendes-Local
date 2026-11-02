"use client";

import React from "react";
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  Star,
  Award,
  ArrowRight,
  Scissors,
  Dog,
  CarFront,
  UtensilsCrossed,
  Cake,
  Wrench,
  Gauge,
  Flame,
  Cookie,
  PawPrint,
} from "lucide-react";
import { sanitizeDescription } from "@/utils/address";
import type { Service } from "@/types";
import {
  getHeroSubtitle,
  getCtaButtonText,
  getServiceIcon,
  formatCurrency,
} from "@/utils/showcase";

interface PublicHeroProps {
  tenantName: string;
  description?: string | null;
  headline?: string | null;
  businessCategory?: string | null;
  themeId?: string | null;
  services?: Service[];
  tenant?: any;
  ctaText?: string | null;
  onOpenBooking: (serviceId?: string) => void;
}

export function PublicHero({
  tenantName,
  description,
  headline,
  businessCategory,
  themeId,
  services = [],
  tenant,
  ctaText,
  onOpenBooking,
}: PublicHeroProps) {
  const cleanDescription = sanitizeDescription(description);
  const heroSubtitle =
    getHeroSubtitle(tenant, undefined, themeId, businessCategory) || cleanDescription;
  const activeServicesList = (tenant?.services || services || []).filter(Boolean);
  const ctaLabel = ctaText || getCtaButtonText(tenant, themeId, businessCategory);

  const isPetShop = themeId === "petshop" || (businessCategory || "").toLowerCase().includes("pet");
  const isConfectionery =
    themeId === "confeitaria" ||
    themeId === "bakery" ||
    themeId === "confectionery" ||
    (businessCategory || "").toLowerCase().includes("confeit") ||
    (businessCategory || "").toLowerCase().includes("bolo") ||
    (businessCategory || "").toLowerCase().includes("doceria");
  const isAutomotive =
    themeId === "automotive" ||
    themeId === "automotivo" ||
    themeId === "auto" ||
    (businessCategory || "").toLowerCase().includes("auto") ||
    (businessCategory || "").toLowerCase().includes("mecanic") ||
    (businessCategory || "").toLowerCase().includes("oficina");
  const isRestaurant =
    themeId === "restaurant" ||
    themeId === "gastronomia" ||
    themeId === "food" ||
    (businessCategory || "").toLowerCase().includes("restauran") ||
    (businessCategory || "").toLowerCase().includes("gastro") ||
    (businessCategory || "").toLowerCase().includes("bar ") ||
    (businessCategory || "").toLowerCase().includes("lanche");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 p-6 sm:p-10 lg:p-12 shadow-sm">
      {/* Elemento Decorativo Sutil de Fundo */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-15"
        style={{
          backgroundColor: isAutomotive
            ? "#2563eb"
            : isRestaurant
            ? "#dc2626"
            : isConfectionery
            ? "#f43f5e"
            : isPetShop
            ? "#ea580c"
            : "var(--primary-color, #0d9488)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center flex flex-col items-center space-y-6">
        
        {/* Badge de Confiança com Ponto Pulsante Suave */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-xs"
          style={{
            backgroundColor: isAutomotive
              ? "rgba(37, 99, 235, 0.12)"
              : isRestaurant
              ? "rgba(220, 38, 38, 0.12)"
              : isConfectionery
              ? "rgba(244, 63, 94, 0.12)"
              : isPetShop
              ? "rgba(234, 88, 12, 0.12)"
              : "var(--primary-alpha-10, rgba(13, 148, 136, 0.1))",
            color: isAutomotive
              ? "#2563eb"
              : isRestaurant
              ? "#dc2626"
              : isConfectionery
              ? "#f43f5e"
              : isPetShop
              ? "#ea580c"
              : "var(--primary-color, #0d9488)",
          }}
        >
          {isAutomotive ? (
            <CarFront className="h-3.5 w-3.5 animate-gauge-needle text-blue-600" />
          ) : isRestaurant ? (
            <UtensilsCrossed className="h-3.5 w-3.5 animate-culinary-float text-red-600" />
          ) : isConfectionery ? (
            <Cake className="h-3.5 w-3.5 animate-sweet-float text-rose-500" />
          ) : isPetShop ? (
            <Dog className="h-3.5 w-3.5 animate-tail-wag text-amber-600" />
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          <span>
            {isAutomotive
              ? "🚗 Oficinas & Autopeças • Diagnóstico de Alta Precisão"
              : isRestaurant
              ? "🍽️ Bares & Restaurantes • Cozinha Autêntica & Sabor Único"
              : isConfectionery
              ? "🎂 Bolos Artesanais & Doces Finos • Aberto Agora"
              : isPetShop
              ? "🐾 Cuidado, Amor & Dedicação Pet • Aberto Agora"
              : (businessCategory ? `Destaque em ${businessCategory}` : "Atendimento Profissional • Aberto Agora")}
          </span>
        </div>

        {/* Título de Alto Impacto com Palavra em Destaque */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
          {isAutomotive ? (
            <>
              Cuidado técnico, segurança e alta performance para o seu{" "}
              <span style={{ color: "var(--primary-color, #2563eb)" }}>
                veículo
              </span>{" "}
              na {tenantName}.
            </>
          ) : isRestaurant ? (
            <>
              A melhor experiência gastronômica e momentos inesquecíveis à{" "}
              <span style={{ color: "var(--primary-color, #dc2626)" }}>
                sua mesa
              </span>{" "}
              no {tenantName}.
            </>
          ) : isConfectionery ? (
            <>
              Os bolos e doces artesanais mais deliciosos para a sua{" "}
              <span style={{ color: "var(--primary-color, #f43f5e)" }}>
                melhor festa
              </span>{" "}
              no {tenantName}.
            </>
          ) : isPetShop ? (
            <>
              O melhor carinho e cuidado para o seu{" "}
              <span style={{ color: "var(--primary-color, #ea580c)" }}>
                melhor amigo
              </span>{" "}
              no {tenantName}.
            </>
          ) : (
            <>
              Sua melhor experiência em{" "}
              <span style={{ color: "var(--primary-color, #0d9488)" }}>
                {businessCategory || "serviços especializados"}
              </span>{" "}
              no {tenantName}.
            </>
          )}
        </h1>

        {/* Subtítulo / Descrição Dinâmica */}
        <p className="text-xs sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
          {heroSubtitle}
        </p>

        {/* Diferenciais Vinculados a Serviços Reais ou Categorias Contextuais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2 text-left">
          {activeServicesList && activeServicesList.length > 0 ? (
            activeServicesList.slice(0, 3).map((service: Service) => {
              const Icon = getServiceIcon(service.name, themeId || "");
              const formattedPrice =
                service.price !== null && Number(service.price) > 0
                  ? formatCurrency(Number(service.price))
                  : null;
              const tagText =
                formattedPrice ||
                (service.duration_minutes ? `${service.duration_minutes} min` : null);

              return (
                <div
                  key={service.id}
                  onClick={() => onOpenBooking(service.id)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition cursor-pointer"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                    style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-xs text-slate-900 truncate" title={service.name}>
                        {service.name}
                      </p>
                      {tagText && (
                        <span className="shrink-0 text-[10px] font-bold text-emerald-600 font-mono">
                          {tagText}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {service.description || "Serviço com padrão de excelência e pontualidade."}
                    </p>
                  </div>
                </div>
              );
            })
          ) : Array.isArray(tenant?.highlights) && tenant.highlights.length > 0 ? (
            tenant.highlights.slice(0, 3).map((item: any, idx: number) => {
              const title =
                typeof item === "string"
                  ? item
                  : item?.title || item?.name || `Diferencial ${idx + 1}`;
              const desc =
                typeof item === "object"
                  ? item?.desc || item?.description
                  : "Atendimento diferenciado e de confiança.";
              const Icon = getServiceIcon(title, themeId || "");

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                    style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">{title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{desc}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {/* Diferencial Contextual 1 */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">
                    {businessCategory ? `Especialidade em ${businessCategory}` : "Profissionais Qualificados"}
                  </p>
                  <p className="text-[11px] text-slate-500">Atendimento dedicado e seguro</p>
                </div>
              </div>

              {/* Diferencial Contextual 2 */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Alto Padrão</p>
                  <p className="text-[11px] text-slate-500">Qualidade comprovada</p>
                </div>
              </div>

              {/* Diferencial Contextual 3 */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Avaliações Positivas</p>
                  <p className="text-[11px] text-slate-500">Satisfação garantida</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-md">
          <button
            type="button"
            onClick={() => onOpenBooking()}
            className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: isAutomotive
                ? "#2563eb"
                : isRestaurant
                ? "#dc2626"
                : isConfectionery
                ? "#f43f5e"
                : isPetShop
                ? "#ea580c"
                : "var(--primary-color, #0d9488)",
            }}
          >
            {isAutomotive ? (
              <Gauge className="h-4 w-4 animate-gauge-needle" />
            ) : isRestaurant ? (
              <UtensilsCrossed className="h-4 w-4 animate-culinary-float" />
            ) : isConfectionery ? (
              <Cake className="h-4 w-4 animate-sweet-float" />
            ) : isPetShop ? (
              <Dog className="h-4 w-4 animate-tail-wag" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            <span>{ctaLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <a
            href="#servicos"
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-3.5 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-all duration-200 active:scale-[0.98]"
          >
            {isAutomotive ? (
              <Wrench className="h-4 w-4 text-blue-500 animate-wrench-tilt" />
            ) : isRestaurant ? (
              <Flame className="h-4 w-4 text-red-500 animate-flame-flicker" />
            ) : isConfectionery ? (
              <Cookie className="h-4 w-4 text-rose-500 animate-sparkle-twinkle" />
            ) : isPetShop ? (
              <PawPrint className="h-4 w-4 text-amber-600 animate-paw-pulse" />
            ) : (
              <Scissors className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            )}
            <span>
              {isAutomotive
                ? "Ver Serviços"
                : isRestaurant
                ? "Ver Cardápio"
                : isConfectionery
                ? "Ver Cardápio"
                : "Ver Serviços"}
            </span>
          </a>
        </div>

      </div>
    </section>
  );
}
