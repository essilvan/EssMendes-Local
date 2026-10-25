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
  Cat,
  Bone,
  PawPrint,
  Cake,
  Cookie,
  Cherry,
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
import { sanitizeDescription } from "@/utils/address";

interface PublicHeroProps {
  tenantName: string;
  description?: string | null;
  businessCategory?: string | null;
  themeId?: string | null;
  onOpenBooking: () => void;
}

export function PublicHero({
  tenantName,
  description,
  businessCategory,
  themeId,
  onOpenBooking,
}: PublicHeroProps) {
  const cleanDescription = sanitizeDescription(description);
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

        {/* Subtítulo / Descrição */}
        <p className="text-xs sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
          {cleanDescription ||
            (isAutomotive
              ? `Manutenção preventiva e corretiva, diagnóstico eletrônico, troca de óleo, freios e suspensão com peças de procedência e garantia no ${tenantName}.`
              : isRestaurant
              ? `Cardápio autoral com ingredientes frescos, opções saborosas para almoço, jantar e drinks especiais em um ambiente acolhedor no ${tenantName}.`
              : isConfectionery
              ? `Bolos decorados, tortas finas, docinhos gourmet e sobremesas feitas com ingredientes nobres e carinho para suas melhores comemorações no ${tenantName}.`
              : isPetShop
              ? `Banho e tosa humanizados, consultas veterinárias e mimos que seu pet merece com todo respeito e segurança no ${tenantName}.`
              : `Conheça nossos serviços e agende seu horário online no ${tenantName}. Atendimento de excelência, pontualidade e satisfação garantida.`)}
        </p>

        {/* Diferenciais com Ícones Temáticos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2 text-left">
          {isAutomotive ? (
            <>
              {/* Diferencial Automotivo 1 */}
              <div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                >
                  <Gauge className="h-4 w-4 animate-gauge-needle" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Diagnóstico Computadorizado</p>
                  <p className="text-[11px] text-slate-500">Scanners de última geração</p>
                </div>
              </div>

              {/* Diferencial Automotivo 2 */}
              <div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                >
                  <Wrench className="h-4 w-4 animate-wrench-tilt" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Mecânica Especializada</p>
                  <p className="text-[11px] text-slate-500">Peças genuínas e garantia</p>
                </div>
              </div>

              {/* Diferencial Automotivo 3 */}
              <div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                >
                  <Disc className="h-4 w-4 animate-disc-spin" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Freios & Suspensão</p>
                  <p className="text-[11px] text-slate-500">Segurança total na rodagem</p>
                </div>
              </div>
            </>
          ) : isRestaurant ? (
            <>
              {/* Diferencial Restaurante 1 */}
              <div className="flex items-center gap-3 rounded-2xl border border-red-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #dc2626)" }}
                >
                  <UtensilsCrossed className="h-4 w-4 animate-culinary-float" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Ingredientes Selecionados</p>
                  <p className="text-[11px] text-slate-500">Frescor em cada receita</p>
                </div>
              </div>

              {/* Diferencial Restaurante 2 */}
              <div className="flex items-center gap-3 rounded-2xl border border-red-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #dc2626)" }}
                >
                  <Flame className="h-4 w-4 animate-flame-flicker text-amber-200" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Cozinha & Brasa Viva</p>
                  <p className="text-[11px] text-slate-500">Ponto e sabor inconfundíveis</p>
                </div>
              </div>

              {/* Diferencial Restaurante 3 */}
              <div className="flex items-center gap-3 rounded-2xl border border-red-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #dc2626)" }}
                >
                  <Wine className="h-4 w-4 animate-culinary-float" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Drinks & Harmonização</p>
                  <p className="text-[11px] text-slate-500">Carta completa de bebidas</p>
                </div>
              </div>
            </>
          ) : isConfectionery ? (
            <>
              {/* Diferencial Confeitaria 1 */}
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #f43f5e)" }}
                >
                  <Cake className="h-4 w-4 animate-sweet-float" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Bolos Personalizados</p>
                  <p className="text-[11px] text-slate-500">Design exclusivo e recheios nobres</p>
                </div>
              </div>

              {/* Diferencial Confeitaria 2 */}
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #f43f5e)" }}
                >
                  <Cookie className="h-4 w-4 animate-sparkle-twinkle" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Doces Gourmet</p>
                  <p className="text-[11px] text-slate-500">Ingredientes frescos e chocolate puro</p>
                </div>
              </div>

              {/* Diferencial Confeitaria 3 */}
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #f43f5e)" }}
                >
                  <Cherry className="h-4 w-4 animate-sweet-float" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Tortas & Sobremesas</p>
                  <p className="text-[11px] text-slate-500">Frutas selecionadas e ponto perfeito</p>
                </div>
              </div>
            </>
          ) : isPetShop ? (
            <>
              {/* Diferencial Pet 1 */}
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #ea580c)" }}
                >
                  <Dog className="h-4 w-4 animate-tail-wag" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Banho & Tosa Humanizada</p>
                  <p className="text-[11px] text-slate-500">Estética sem traumas nem estresse</p>
                </div>
              </div>

              {/* Diferencial Pet 2 */}
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #ea580c)" }}
                >
                  <Cat className="h-4 w-4 animate-paw-float" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Espaço Cat-Friendly</p>
                  <p className="text-[11px] text-slate-500">Ambiente tranquilo e dedicado</p>
                </div>
              </div>

              {/* Diferencial Pet 3 */}
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-white p-3.5 shadow-2xs hover:-translate-y-0.5 transition">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #ea580c)" }}
                >
                  <Bone className="h-4 w-4 animate-tail-wag" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Mimos & Saúde Animal</p>
                  <p className="text-[11px] text-slate-500">Produtos seguros e petiscos</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Diferencial 1 */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Profissionais Qualificados</p>
                  <p className="text-[11px] text-slate-500">Atendimento dedicado e seguro</p>
                </div>
              </div>

              {/* Diferencial 2 */}
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

              {/* Diferencial 3 */}
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
            onClick={onOpenBooking}
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
            <span>
              {isAutomotive
                ? "Agendar Diagnóstico"
                : isRestaurant
                ? "Reservar Mesa / Pedir"
                : isConfectionery
                ? "Fazer Encomenda"
                : isPetShop
                ? "Agendar Cuidados do Pet"
                : "Agendar Horário"}
            </span>
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
