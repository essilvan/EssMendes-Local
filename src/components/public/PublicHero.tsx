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
  Footprints,
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

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 p-6 sm:p-10 lg:p-12 shadow-sm">
      {/* Elemento Decorativo Sutil de Fundo */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
      />

      <div className="relative mx-auto max-w-3xl text-center flex flex-col items-center space-y-6">
        
        {/* Badge de Confiança com Ponto Pulsante Suave */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-xs"
          style={{
            backgroundColor: isPetShop ? "rgba(234, 88, 12, 0.12)" : "var(--primary-alpha-10, rgba(13, 148, 136, 0.1))",
            color: isPetShop ? "#ea580c" : "var(--primary-color, #0d9488)",
          }}
        >
          {isPetShop ? (
            <Dog className="h-3.5 w-3.5 animate-tail-wag text-amber-600" />
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          <span>{isPetShop ? "🐾 Cuidado, Amor & Dedicação Pet • Aberto Agora" : (businessCategory ? `Destaque em ${businessCategory}` : "Atendimento Profissional • Aberto Agora")}</span>
        </div>

        {/* Título de Alto Impacto com Palavra em Destaque */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
          {isPetShop ? (
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
            (isPetShop
              ? `Banho e tosa humanizados, consultas veterinárias e mimos que seu pet merece com todo respeito e segurança no ${tenantName}.`
              : `Conheça nossos serviços e agende seu horário online no ${tenantName}. Atendimento de excelência, pontualidade e satisfação garantida.`)}
        </p>

        {/* Diferenciais com Ícones Temáticos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2 text-left">
          {isPetShop ? (
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
            className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
          >
            {isPetShop ? (
              <Dog className="h-4 w-4 animate-tail-wag" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            <span>{isPetShop ? "Agendar Cuidados do Pet" : "Agendar Horário"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <a
            href="#servicos"
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-3.5 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-all duration-200 active:scale-[0.98]"
          >
            {isPetShop ? (
              <Footprints className="h-4 w-4 text-amber-600 animate-paw-pulse" />
            ) : (
              <Scissors className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            )}
            <span>Ver Serviços</span>
          </a>
        </div>

      </div>
    </section>
  );
}
