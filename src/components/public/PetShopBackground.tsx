"use client";

import React from "react";
import { PawPrint, Bone, Dog, Cat } from "lucide-react";

/**
 * SVG limpo e autêntico de patinha de pet com almofada central e 4 dedinhos arredondados
 */
export function PetPawSvg({
  className = "w-6 h-6",
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Almofada principal (palma arredondada e anatômica) */}
      <path d="M12 11.2c-2.4 0-4.6 1.6-4.6 4.1 0 2.2 1.8 3.7 4.6 3.7s4.6-1.5 4.6-3.7c0-2.5-2.2-4.1-4.6-4.1z" />
      {/* Dedinho 1 - Esquerdo externo */}
      <ellipse cx="6.2" cy="10.2" rx="1.5" ry="2.1" transform="rotate(-24 6.2 10.2)" />
      {/* Dedinho 2 - Esquerdo interno */}
      <ellipse cx="9.8" cy="7.2" rx="1.6" ry="2.3" transform="rotate(-8 9.8 7.2)" />
      {/* Dedinho 3 - Direito interno */}
      <ellipse cx="14.2" cy="7.2" rx="1.6" ry="2.3" transform="rotate(8 14.2 7.2)" />
      {/* Dedinho 4 - Direito externo */}
      <ellipse cx="17.8" cy="10.2" rx="1.5" ry="2.1" transform="rotate(24 17.8 10.2)" />
    </svg>
  );
}

/**
 * Fundo Decorativo Temático do Nicho Pet Shop
 * Posiciona trilhas de patinhas, ossinhos e silhuetas nas laterais com opacidade suave (15% a 25%)
 * mantendo o centro do site limpo e 100% legível.
 */
export function PetShopBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* 1. Iluminação Ambiente em Tons Quentes (Âmbar e Laranja Suave) */}
      <div className="absolute -top-36 -right-36 w-[28rem] h-[28rem] rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute top-[35%] -left-36 w-[26rem] h-[26rem] rounded-full bg-orange-200/30 blur-3xl" />
      <div className="absolute top-[65%] -right-32 w-[24rem] h-[24rem] rounded-full bg-amber-200/25 blur-3xl" />
      <div className="absolute -bottom-36 left-1/4 w-[28rem] h-[28rem] rounded-full bg-orange-100/45 blur-3xl" />

      {/* ============================================================== */}
      {/* 2. TRILHA LATERAL ESQUERDA (Passinhos, ossinhos e silhuetas)   */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        {/* Par de Patinhas 1 (Topo esquerdo - entrada) */}
        <div
          className="absolute top-16 left-4 sm:left-8 rotate-[-26deg] opacity-20 text-amber-900 animate-paw-pulse"
          title="Passinho Pet"
        >
          <PetPawSvg className="w-12 h-12" />
        </div>
        <div
          className="absolute top-28 left-12 sm:left-16 rotate-[-10deg] opacity-25 text-amber-900 animate-paw-float"
          title="Passinho Pet"
        >
          <PawPrint className="w-10 h-10" />
        </div>

        {/* Ossinho Flutuante 1 (Lateral superior) */}
        <div
          className="absolute top-[22%] left-6 sm:left-12 rotate-[38deg] opacity-20 text-orange-900 animate-paw-float"
          title="Mimo Pet"
        >
          <Bone className="w-12 h-12" />
        </div>

        {/* Trilha de Patinhas 2 (Meio-superior) */}
        <div
          className="absolute top-[34%] left-3 sm:left-6 rotate-[-35deg] opacity-20 text-amber-900 animate-paw-pulse"
        >
          <PawPrint className="w-11 h-11" />
        </div>
        <div
          className="absolute top-[39%] left-10 sm:left-14 rotate-[-15deg] opacity-25 text-amber-900 animate-paw-float"
        >
          <PetPawSvg className="w-12 h-12" />
        </div>

        {/* Silhueta Sutil de Cãozinho 1 (Meio da página) */}
        <div
          className="absolute top-[52%] left-4 sm:left-8 rotate-[-6deg] opacity-15 text-amber-900 group hover:opacity-25 transition-opacity"
          title="Amigo Pet"
        >
          <Dog className="w-16 h-16 animate-tail-wag" />
        </div>

        {/* Ossinho Flutuante 2 (Meio-inferior) */}
        <div
          className="absolute top-[66%] left-6 sm:left-14 rotate-[-42deg] opacity-20 text-orange-900 animate-paw-float"
        >
          <Bone className="w-10 h-10" />
        </div>

        {/* Trilha de Patinhas 3 (Inferior) */}
        <div
          className="absolute top-[78%] left-3 sm:left-6 rotate-[24deg] opacity-20 text-amber-900 animate-paw-pulse"
        >
          <PetPawSvg className="w-14 h-14" />
        </div>
        <div
          className="absolute top-[85%] left-10 sm:left-16 rotate-[38deg] opacity-25 text-amber-900 animate-paw-float"
        >
          <PawPrint className="w-12 h-12" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TRILHA LATERAL DIREITA (Passinhos, ossinhos e silhuetas)   */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        {/* Silhueta Sutil de Gatinho 1 (Topo direito) */}
        <div
          className="absolute top-20 right-4 sm:right-10 rotate-[12deg] opacity-20 text-amber-900 animate-paw-float"
          title="Gatinho Aconchegante"
        >
          <Cat className="w-14 h-14" />
        </div>

        {/* Par de Patinhas 1 (Lateral superior) */}
        <div
          className="absolute top-40 right-10 sm:right-18 rotate-[28deg] opacity-25 text-amber-900 animate-paw-pulse"
        >
          <PetPawSvg className="w-12 h-12" />
        </div>
        <div
          className="absolute top-52 right-3 sm:right-8 rotate-[42deg] opacity-20 text-amber-900 animate-paw-float"
        >
          <PawPrint className="w-11 h-11" />
        </div>

        {/* Ossinho Flutuante 1 (Lateral direita) */}
        <div
          className="absolute top-[30%] right-6 sm:right-12 rotate-[-30deg] opacity-20 text-orange-900 animate-paw-float"
          title="Petisco"
        >
          <Bone className="w-12 h-12" />
        </div>

        {/* Trilha de Patinhas 2 (Meio) */}
        <div
          className="absolute top-[44%] right-4 sm:right-10 rotate-[18deg] opacity-20 text-amber-900 animate-paw-pulse"
        >
          <PetPawSvg className="w-13 h-13" />
        </div>
        <div
          className="absolute top-[49%] right-10 sm:right-16 rotate-[5deg] opacity-25 text-amber-900 animate-paw-float"
        >
          <PawPrint className="w-10 h-10" />
        </div>

        {/* Silhueta Sutil de Cãozinho 2 (Meio-inferior) */}
        <div
          className="absolute top-[60%] right-4 sm:right-10 rotate-[8deg] opacity-15 text-amber-900"
          title="Companheiro Fiel"
        >
          <Dog className="w-16 h-16 animate-tail-wag" />
        </div>

        {/* Ossinho Flutuante 2 (Inferior direito) */}
        <div
          className="absolute top-[72%] right-8 sm:right-14 rotate-[45deg] opacity-20 text-orange-900 animate-paw-float"
        >
          <Bone className="w-11 h-11" />
        </div>

        {/* Trilha de Patinhas 3 (Base direita) */}
        <div
          className="absolute top-[82%] right-4 sm:right-8 rotate-[-25deg] opacity-25 text-amber-900 animate-paw-pulse"
        >
          <PetPawSvg className="w-14 h-14" />
        </div>
        <div
          className="absolute top-[89%] right-10 sm:right-16 rotate-[-12deg] opacity-20 text-amber-900 animate-paw-float"
        >
          <PawPrint className="w-12 h-12" />
        </div>
      </div>
    </div>
  );
}
