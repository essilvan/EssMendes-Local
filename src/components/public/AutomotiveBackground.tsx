"use client";

import React from "react";
import { CarFront, Wrench, Gauge, Cog, Disc } from "lucide-react";

/**
 * SVG técnico e preciso de engrenagem industrial com dentes mecânicos e chanfro central
 */
export function GearSvg({
  className = "w-8 h-8",
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
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * SVG de disco de freio ventilado de alta performance com furos de refrigeração e cubo central
 */
export function BrakeDiscSvg({
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
      {/* Pista externa do disco */}
      <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="1.6" />
      {/* Pista intermediária */}
      <circle cx="12" cy="12" r="6.5" stroke={stroke} strokeWidth="1.2" strokeDasharray="2 2" />
      {/* Cubo central metálico */}
      <circle cx="12" cy="12" r="3.2" stroke={stroke} strokeWidth="1.6" />
      {/* Furo do eixo central */}
      <circle cx="12" cy="12" r="1.2" fill={stroke} />
      {/* Furos de ventilação / fixação */}
      <circle cx="12" cy="8.2" r="0.75" fill={stroke} />
      <circle cx="12" cy="15.8" r="0.75" fill={stroke} />
      <circle cx="8.2" cy="12" r="0.75" fill={stroke} />
      <circle cx="15.8" cy="12" r="0.75" fill={stroke} />
      <circle cx="9.3" cy="9.3" r="0.65" fill={stroke} />
      <circle cx="14.7" cy="14.7" r="0.65" fill={stroke} />
      <circle cx="9.3" cy="14.7" r="0.65" fill={stroke} />
      <circle cx="14.7" cy="9.3" r="0.65" fill={stroke} />
    </svg>
  );
}

/**
 * Fundo Decorativo Temático do Nicho Automotivo & Mecânica (id: 'automotive')
 * Posiciona engrenagens com rotação suave contínua, ferramentas com balanço mecânico,
 * manômetros e discos de freio nas laterais com opacidade técnica (15% a 20%),
 * preservando o centro da vitrine e orçamentos 100% legíveis.
 */
export function AutomotiveBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* 1. Iluminação Ambiente Metálica / Técnica (Azul Automotivo e Laranja Industrial) */}
      <div className="absolute -top-36 -right-36 w-[32rem] h-[32rem] rounded-full bg-blue-600/15 blur-3xl" />
      <div className="absolute top-[32%] -left-36 w-[30rem] h-[30rem] rounded-full bg-slate-700/20 blur-3xl" />
      <div className="absolute top-[58%] -right-32 w-[28rem] h-[28rem] rounded-full bg-orange-600/12 blur-3xl" />
      <div className="absolute -bottom-36 left-1/4 w-[32rem] h-[32rem] rounded-full bg-sky-600/12 blur-3xl" />

      {/* ============================================================== */}
      {/* 2. TRILHA LATERAL ESQUERDA (Engrenagens, Ferramentas & Disco)  */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        {/* Par de Engrenagens Mecânicas 1 (Topo esquerdo) */}
        <div
          className="absolute top-14 left-4 sm:left-8 opacity-20 text-blue-400 animate-gear-spin"
          title="Engrenagem Industrial"
        >
          <GearSvg className="w-12 h-12" />
        </div>
        <div
          className="absolute top-24 left-12 sm:left-18 opacity-15 text-slate-400 animate-gear-spin-reverse"
          title="Engrenagem Conectada"
        >
          <Cog className="w-8 h-8" />
        </div>

        {/* Ferramenta / Chave Inglesa com Balanço Técnico */}
        <div
          className="absolute top-[22%] left-5 sm:left-10 opacity-20 text-orange-400 animate-wrench-tilt"
          title="Ferramenta de Precisão"
        >
          <Wrench className="w-11 h-11" />
        </div>

        {/* Manômetro / Gauge de Pressão */}
        <div
          className="absolute top-[35%] left-3 sm:left-6 opacity-20 text-sky-400 animate-gauge-needle"
          title="Diagnóstico & Pressão"
        >
          <Gauge className="w-10 h-10" />
        </div>

        {/* Silhueta Frontal de Veículo */}
        <div
          className="absolute top-[48%] left-4 sm:left-8 opacity-15 text-slate-400"
          title="Linha Automotiva"
        >
          <CarFront className="w-12 h-12" />
        </div>

        {/* Disco de Freio Ventilado Flutuante */}
        <div
          className="absolute top-[60%] left-6 sm:left-12 opacity-20 text-slate-300 animate-disc-spin"
          title="Disco de Freio Ventilado"
        >
          <BrakeDiscSvg className="w-12 h-12" />
        </div>

        {/* Engrenagem Média (Meio-inferior) */}
        <div
          className="absolute top-[74%] left-3 sm:left-7 opacity-20 text-blue-400 animate-gear-spin"
        >
          <Cog className="w-11 h-11" />
        </div>

        {/* Chave + Disco (Inferior) */}
        <div
          className="absolute top-[86%] left-6 sm:left-14 opacity-15 text-orange-400 animate-wrench-tilt"
        >
          <Wrench className="w-10 h-10" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TRILHA LATERAL DIREITA (Engrenagens, Manômetros & Freios)   */}
      {/* ============================================================== */}
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-36 lg:w-48 overflow-hidden pointer-events-none">
        {/* Disco de Freio de Alta Performance 1 (Topo direito) */}
        <div
          className="absolute top-16 right-4 sm:right-10 opacity-20 text-slate-300 animate-disc-spin"
          title="Disco de Freio"
        >
          <Disc className="w-12 h-12" />
        </div>

        {/* Manômetro / Instrumentação (Superior direito) */}
        <div
          className="absolute top-[20%] right-6 sm:right-14 opacity-20 text-sky-400 animate-gauge-needle"
          title="Gauge Técnico"
        >
          <Gauge className="w-11 h-11" />
        </div>

        {/* Engrenagem Industrial com Rotação Horária */}
        <div
          className="absolute top-[32%] right-5 sm:right-12 opacity-20 text-blue-400 animate-gear-spin"
          title="Engrenagem Mecânica"
        >
          <GearSvg className="w-13 h-13" />
        </div>

        {/* Chave de Precisão (Meio) */}
        <div
          className="absolute top-[44%] right-4 sm:right-8 opacity-15 text-orange-400 animate-wrench-tilt"
          title="Manutenção Mecânica"
        >
          <Wrench className="w-10 h-10" />
        </div>

        {/* Silhueta Frontal de Veículo */}
        <div
          className="absolute top-[56%] right-6 sm:right-14 opacity-15 text-slate-400"
          title="Centro Automotivo"
        >
          <CarFront className="w-12 h-12" />
        </div>

        {/* Conjunto Duplo de Engrenagens (Meio-inferior) */}
        <div
          className="absolute top-[68%] right-5 sm:right-10 opacity-20 text-blue-400 animate-gear-spin"
        >
          <GearSvg className="w-11 h-11" />
        </div>
        <div
          className="absolute top-[75%] right-10 sm:right-18 opacity-15 text-slate-400 animate-gear-spin-reverse"
        >
          <Cog className="w-8 h-8" />
        </div>

        {/* Disco de Freio Ventilado + Gauge (Inferior direito) */}
        <div
          className="absolute top-[84%] right-4 sm:right-8 opacity-20 text-slate-300 animate-disc-spin"
        >
          <BrakeDiscSvg className="w-11 h-11" />
        </div>
      </div>
    </div>
  );
}
