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
} from "lucide-react";
import { sanitizeDescription } from "@/utils/address";

interface PublicHeroProps {
  tenantName: string;
  description?: string | null;
  businessCategory?: string | null;
  onOpenBooking: () => void;
}

export function PublicHero({
  tenantName,
  description,
  businessCategory,
  onOpenBooking,
}: PublicHeroProps) {
  const cleanDescription = sanitizeDescription(description);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 p-6 sm:p-10 lg:p-12 shadow-sm">
      {/* Elemento Decorativo Sutil de Fundo */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
      />

      <div className="relative mx-auto max-w-3xl text-center flex flex-col items-center space-y-6">
        
        {/* Badge de Confiança */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-xs"
          style={{
            backgroundColor: "var(--primary-alpha-10, rgba(13, 148, 136, 0.1))",
            color: "var(--primary-color, #0d9488)",
          }}
        >
          <Sparkles className="h-3.5 w-3.5 fill-current" />
          <span>{businessCategory ? `Destaque em ${businessCategory}` : "Atendimento Profissional na Região"}</span>
        </div>

        {/* Título de Alto Impacto com Palavra em Destaque */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          Sua melhor experiência em{" "}
          <span style={{ color: "var(--primary-color, #0d9488)" }}>
            {businessCategory || "serviços especializados"}
          </span>{" "}
          no {tenantName}.
        </h1>

        {/* Subtítulo / Descrição */}
        <p className="text-xs sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
          {cleanDescription ||
            `Conheça nossos serviços e agende seu horário online no ${tenantName}. Atendimento de excelência, pontualidade e satisfação garantida.`}
        </p>

        {/* 3 Diferenciais com Ícones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2 text-left">
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
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-md">
          <button
            type="button"
            onClick={onOpenBooking}
            className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:opacity-95 active:scale-95"
            style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
          >
            <Calendar className="h-4 w-4" />
            <span>Agendar Horário</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <a
            href="#servicos"
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition"
          >
            <Scissors className="h-4 w-4 text-slate-500" />
            <span>Ver Serviços</span>
          </a>
        </div>

      </div>
    </section>
  );
}
