"use client";

import React from "react";
import { Cake, Cookie, Sparkles, Heart, Cherry, Coffee } from "lucide-react";

/**
 * SVG limpo e minimalista de confeitos / granulados coloridos
 */
export function SprinklesSvg({
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
      {/* Granulado 1 - Rosa doce inclinado */}
      <rect x="4" y="6" width="7" height="2.5" rx="1.25" transform="rotate(30 4 6)" fill="#f43f5e" />
      {/* Granulado 2 - Baunilha dourada vertical */}
      <rect x="18" y="4" width="7" height="2.5" rx="1.25" transform="rotate(-40 18 4)" fill="#f59e0b" />
      {/* Granulado 3 - Chocolate/Caramelo */}
      <rect x="8" y="18" width="7" height="2.5" rx="1.25" transform="rotate(65 8 18)" fill="#881337" />
      {/* Granulado 4 - Rosa pastel */}
      <rect x="20" y="20" width="7" height="2.5" rx="1.25" transform="rotate(-20 20 20)" fill="#fb7185" />
      {/* Confeito em bolinha / pérola de açúcar */}
      <circle cx="16" cy="13" r="1.8" fill="#fbbf24" />
      <circle cx="26" cy="11" r="1.5" fill="#f43f5e" />
    </svg>
  );
}

/**
 * SVG delicado de fatia de bolo / torta com camadas de recheio
 */
export function CakeSliceSvg({
  className = "w-10 h-10",
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Base da fatia de bolo triangular */}
      <path
        d="M2.5 18.5L21.5 18.5C21.8 18.5 22 18.2 22 17.8L21 8.5L12 3.5L2 9.5L2 18C2 18.3 2.2 18.5 2.5 18.5Z"
        stroke={fill}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Camada de recheio 1 */}
      <path d="M2.2 14.5L21.3 14.5" stroke={fill} strokeWidth="1.4" strokeDasharray="2 2" />
      {/* Camada de recheio 2 */}
      <path d="M2.2 11.5L21.1 11.5" stroke={fill} strokeWidth="1.4" />
      {/* Morango / cereja decorativa no topo */}
      <circle cx="12" cy="4" r="1.6" fill={fill} />
    </svg>
  );
}

/**
 * Fundo Decorativo Temático do Nicho Confeitaria & Bolos
 * Espalha confeitos flutuantes, fatias de bolo, cupcakes, cookies e faíscas pelas laterais
 * com opacidade suave (15% a 25%) em tons de rosa doce, calda de caramelo e baunilha,
 * mantendo o centro do cardápio e preços 100% legíveis.
 */
export function ConfectioneryBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* 1. Iluminação Ambiente em Tons Aconchegantes de Baunilha e Rosa Suave */}
      <div className="absolute -top-36 -right-36 w-[30rem] h-[30rem] rounded-full bg-rose-200/35 blur-3xl" />
      <div className="absolute top-[32%] -left-36 w-[28rem] h-[28rem] rounded-full bg-amber-100/40 blur-3xl" />
      <div className="absolute top-[62%] -right-32 w-[26rem] h-[26rem] rounded-full bg-pink-100/35 blur-3xl" />
      <div className="absolute -bottom-36 left-1/4 w-[30rem] h-[30rem] rounded-full bg-rose-100/30 blur-3xl" />

      {/* ============================================================== */}
      {/* 2. TRILHA LATERAL ESQUERDA (Confeitos, Bolos, Docinhos, etc.)  */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        {/* Bolo de Festa 1 (Topo esquerdo) */}
        <div
          className="absolute top-16 left-4 sm:left-8 rotate-[-12deg] opacity-20 text-rose-800 animate-sweet-float"
          title="Bolo Confeitado"
        >
          <Cake className="w-12 h-12" />
        </div>

        {/* Granulados caindo suavemente 1 */}
        <div
          className="absolute top-36 left-10 sm:left-18 rotate-[25deg] opacity-25 animate-sprinkle-fall"
          title="Confeitos Coloridos"
        >
          <SprinklesSvg className="w-11 h-11" />
        </div>

        {/* Faísca / Estrelinha de Açúcar 1 */}
        <div
          className="absolute top-[24%] left-5 sm:left-12 rotate-[18deg] opacity-20 text-amber-600 animate-sparkle-twinkle"
          title="Toque de Brilho"
        >
          <Sparkles className="w-10 h-10" />
        </div>

        {/* Cookie / Biscoito Gourmet 1 */}
        <div
          className="absolute top-[36%] left-3 sm:left-7 rotate-[-22deg] opacity-20 text-amber-900 animate-sweet-float"
          title="Cookie Artesanal"
        >
          <Cookie className="w-12 h-12" />
        </div>

        {/* Granulados 2 (Meio) */}
        <div
          className="absolute top-[48%] left-8 sm:left-14 rotate-[-35deg] opacity-25 animate-sprinkle-fall"
        >
          <SprinklesSvg className="w-10 h-10" />
        </div>

        {/* Fatia de Torta / Bolo 1 (Meio-inferior) */}
        <div
          className="absolute top-[58%] left-4 sm:left-8 rotate-[15deg] opacity-20 text-rose-800 animate-sweet-float"
          title="Fatia Especial"
        >
          <CakeSliceSvg className="w-12 h-12" />
        </div>

        {/* Cereja do Bolo 1 */}
        <div
          className="absolute top-[72%] left-6 sm:left-14 rotate-[-18deg] opacity-25 text-rose-700 animate-sweet-float"
          title="Cereja Fresca"
        >
          <Cherry className="w-11 h-11" />
        </div>

        {/* Granulados 3 (Base esquerda) */}
        <div
          className="absolute top-[82%] left-3 sm:left-6 rotate-[32deg] opacity-20 animate-sprinkle-fall"
        >
          <SprinklesSvg className="w-12 h-12" />
        </div>

        {/* Coração Doce 1 (Rodapé esquerdo) */}
        <div
          className="absolute top-[90%] left-8 sm:left-16 rotate-[-14deg] opacity-20 text-rose-600 animate-sparkle-twinkle"
        >
          <Heart className="w-10 h-10 fill-rose-500/20" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TRILHA LATERAL DIREITA (Confeitos, Bolos, Docinhos, etc.) */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        {/* Cereja do Bolo 2 (Topo direito) */}
        <div
          className="absolute top-20 right-4 sm:right-10 rotate-[22deg] opacity-25 text-rose-700 animate-sweet-float"
          title="Cereja"
        >
          <Cherry className="w-12 h-12" />
        </div>

        {/* Granulados caindo suavemente 1 (Direita) */}
        <div
          className="absolute top-40 right-10 sm:right-18 rotate-[-28deg] opacity-20 animate-sprinkle-fall"
        >
          <SprinklesSvg className="w-12 h-12" />
        </div>

        {/* Fatia de Bolo / Torta 2 */}
        <div
          className="absolute top-[28%] right-5 sm:right-12 rotate-[-16deg] opacity-20 text-rose-800 animate-sweet-float"
          title="Fatia de Torta"
        >
          <CakeSliceSvg className="w-12 h-12" />
        </div>

        {/* Brilho / Faísca 2 */}
        <div
          className="absolute top-[40%] right-3 sm:right-8 rotate-[42deg] opacity-25 text-amber-600 animate-sparkle-twinkle"
        >
          <Sparkles className="w-11 h-11" />
        </div>

        {/* Bolo de Festa 2 (Meio) */}
        <div
          className="absolute top-[52%] right-6 sm:right-14 rotate-[12deg] opacity-20 text-rose-800 animate-sweet-float"
          title="Bolo Artesanal"
        >
          <Cake className="w-14 h-14" />
        </div>

        {/* Granulados 2 (Direita) */}
        <div
          className="absolute top-[64%] right-4 sm:right-10 rotate-[30deg] opacity-25 animate-sprinkle-fall"
        >
          <SprinklesSvg className="w-11 h-11" />
        </div>

        {/* Cookie / Biscoito 2 */}
        <div
          className="absolute top-[75%] right-8 sm:right-16 rotate-[-25deg] opacity-20 text-amber-900 animate-sweet-float"
          title="Cookie Recheado"
        >
          <Cookie className="w-12 h-12" />
        </div>

        {/* Xícara de Café / Acompanhamento 1 */}
        <div
          className="absolute top-[84%] right-4 sm:right-8 rotate-[15deg] opacity-20 text-amber-800 animate-sweet-float"
          title="Café com Bolo"
        >
          <Coffee className="w-11 h-11" />
        </div>

        {/* Faísca de Açúcar Final */}
        <div
          className="absolute top-[92%] right-10 sm:right-16 rotate-[-20deg] opacity-25 text-rose-600 animate-sparkle-twinkle"
        >
          <Sparkles className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
}
