"use client";

import React from "react";
import { Utensils, Wine, Sparkles } from "lucide-react";

/**
 * SVG delicado de faíscas gastronômicas e brasas douradas incandescentes
 */
export function CulinarySparkSvg({
  className = "w-8 h-8",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Brasa central incandescente */}
      <circle cx="16" cy="16" r="2.5" fill="#f59e0b" />
      {/* Faísca 1 - Âmbar quente */}
      <path
        d="M16 6V10M16 22V26M6 16H10M22 16H26"
        stroke="#ea580c"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Faíscas diagonais sutis */}
      <circle cx="10" cy="10" r="1.2" fill="#ef4444" />
      <circle cx="22" cy="10" r="1.4" fill="#f59e0b" />
      <circle cx="9" cy="23" r="1.3" fill="#ea580c" />
      <circle cx="23" cy="22" r="1.2" fill="#ef4444" />
    </svg>
  );
}

/**
 * SVG estilizado de prato gastronômico com cloche (redoma) e vapor de sabor
 */
export function ClochePlateSvg({
  className = "w-10 h-10",
  stroke = "currentColor",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Puxador da cloche */}
      <circle cx="12" cy="5" r="1.5" stroke={stroke} strokeWidth="1.4" />
      {/* Redoma / Cloche */}
      <path
        d="M4 14C4 9.58172 7.58172 6 12 6C16.4183 6 20 9.58172 20 14"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Base do prato */}
      <path
        d="M2 17H22"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 17L6.5 19H17.5L19 17"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Fundo Decorativo Temático do Nicho Restaurantes & Gastronomia (id: 'restaurant')
 * Tema escuro sofisticado (bg-zinc-950), com iluminação ambiente sutil em âmbar/laranja
 * e ícones gastronômicos delicados nas margens laterais.
 */
export function RestaurantBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* 1. Iluminação Ambiente em Tons Sofisticados de Âmbar e Laranja sobre Grafite Escuro */}
      <div className="absolute -top-36 -right-36 w-[32rem] h-[32rem] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute top-[30%] -left-36 w-[28rem] h-[28rem] rounded-full bg-orange-600/10 blur-3xl" />
      <div className="absolute top-[60%] -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-600/8 blur-3xl" />
      <div className="absolute -bottom-36 left-1/4 w-[30rem] h-[30rem] rounded-full bg-orange-500/8 blur-3xl" />

      {/* ============================================================== */}
      {/* 2. TRILHA LATERAL ESQUERDA                                     */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        <div
          className="absolute top-16 left-4 sm:left-8 opacity-15 text-amber-400/70 animate-culinary-float"
          title="Gastronomia"
        >
          <Utensils className="w-12 h-12" />
        </div>

        <div
          className="absolute top-36 left-10 sm:left-16 opacity-20 animate-ember-rise"
          title="Faísca Gastronômica"
        >
          <CulinarySparkSvg className="w-10 h-10" />
        </div>

        <div
          className="absolute top-[24%] left-5 sm:left-10 opacity-15 text-orange-500 animate-flame-flicker"
          title="Destaques da Casa"
        >
          <Sparkles className="w-11 h-11" />
        </div>

        <div
          className="absolute top-[36%] left-3 sm:left-7 opacity-15 text-amber-400 animate-culinary-float"
          title="Prato Gourmet"
        >
          <ClochePlateSvg className="w-12 h-12" />
        </div>

        <div
          className="absolute top-[50%] left-6 sm:left-12 opacity-15 text-amber-500 animate-culinary-float"
          title="Carta de Bebidas"
        >
          <Wine className="w-11 h-11" />
        </div>

        <div
          className="absolute top-[64%] left-4 sm:left-8 opacity-15 text-orange-400 animate-steam-drift"
          title="Prato Especial"
        >
          <Utensils className="w-11 h-11" />
        </div>

        <div
          className="absolute top-[76%] left-6 sm:left-14 opacity-15 text-zinc-400 animate-steam-drift"
          title="Especialidades"
        >
          <Sparkles className="w-10 h-10" />
        </div>

        <div
          className="absolute top-[88%] left-4 sm:left-9 opacity-20 animate-ember-rise"
        >
          <CulinarySparkSvg className="w-11 h-11" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TRILHA LATERAL DIREITA                                      */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        <div
          className="absolute top-16 right-4 sm:right-10 opacity-15 text-orange-500 animate-flame-flicker"
          title="Especialidades"
        >
          <Sparkles className="w-12 h-12" />
        </div>

        <div
          className="absolute top-[22%] right-6 sm:right-12 opacity-15 text-amber-500 animate-culinary-float"
          title="Degustação & Harmonização"
        >
          <Wine className="w-11 h-11" />
        </div>

        <div
          className="absolute top-[34%] right-5 sm:right-14 opacity-20 animate-ember-rise"
        >
          <CulinarySparkSvg className="w-10 h-10" />
        </div>

        <div
          className="absolute top-[46%] right-4 sm:right-8 opacity-15 text-amber-400 animate-culinary-float"
          title="Alta Gastronomia"
        >
          <ClochePlateSvg className="w-12 h-12" />
        </div>

        <div
          className="absolute top-[58%] right-6 sm:right-12 opacity-15 text-amber-400/70 animate-culinary-float"
          title="Menu A la Carte"
        >
          <Utensils className="w-12 h-12" />
        </div>

        <div
          className="absolute top-[72%] right-5 sm:right-10 opacity-15 text-orange-400 animate-steam-drift"
          title="Preparo Artesanal"
        >
          <Utensils className="w-11 h-11" />
        </div>

        <div
          className="absolute top-[84%] right-4 sm:right-8 opacity-15 text-zinc-400 animate-steam-drift"
        >
          <Sparkles className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
}
