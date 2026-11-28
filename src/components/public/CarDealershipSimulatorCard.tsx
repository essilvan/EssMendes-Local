"use client";

import React, { useState } from "react";
import {
  CarFront,
  MessageCircle,
  ShieldCheck,
  Repeat,
  Calculator,
  Check,
} from "lucide-react";
import { sanitizePhoneNumber } from "@/utils/phone";
import { extractNeighborhoodAndCity } from "@/utils/address";

interface CarDealershipSimulatorCardProps {
  tenantName: string;
  phoneWhatsapp?: string | null;
  address?: string | null;
}

export function CarDealershipSimulatorCard({
  tenantName,
  phoneWhatsapp,
  address,
}: CarDealershipSimulatorCardProps) {
  const [wantsFinancing, setWantsFinancing] = useState(true);
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [desiredVehicle, setDesiredVehicle] = useState("");

  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";
  const cleanCity = extractNeighborhoodAndCity(address);

  const handleOpenWhatsApp = () => {
    const interests: string[] = [];
    if (wantsFinancing) interests.push("Simulação de Financiamento");
    if (hasTradeIn) interests.push("Avaliação do meu carro usado na troca");
    if (interests.length === 0) interests.push("Consultar veículos em estoque");

    const lines = [
      `Olá, equipe da *${tenantName}*!`,
      `Estou na vitrine online e tenho interesse em: *${interests.join(" + ")}*.`,
      desiredVehicle.trim()
        ? `Veículo / perfil de interesse: *${desiredVehicle.trim()}*.`
        : null,
      `Pode me passar as condições disponíveis?`,
    ].filter(Boolean);

    const encoded = encodeURIComponent(lines.join("\n"));
    const url = cleanPhone
      ? `https://wa.me/${
          cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`
        }?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="simulador-financiamento"
      className="mb-8 scroll-mt-24 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xl shadow-slate-200/60"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Esquerda: Título & Seleção Rápida */}
        <div className="space-y-3.5 flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
            <Calculator className="h-3.5 w-3.5 text-blue-700" />
            <span>Simulador Rápido • Aprovação Facilitada</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Simule seu Financiamento ou Troca
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Selecione como deseja negociar seu próximo seminovo
              {cleanCity ? ` em ${cleanCity}` : ""} e receba uma simulação
              personalizada em minutos no WhatsApp.
            </p>
          </div>

          {/* Toggle Pills: Desejo financiar / Tenho carro na troca */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setWantsFinancing((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                wantsFinancing
                  ? "border-blue-600 bg-blue-50 text-blue-900 shadow-2xs"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  wantsFinancing
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {wantsFinancing && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
              <Calculator className="h-4 w-4 text-blue-700" />
              <span>Desejo financiar</span>
            </button>

            <button
              type="button"
              onClick={() => setHasTradeIn((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                hasTradeIn
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  hasTradeIn
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {hasTradeIn && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
              <Repeat className="h-4 w-4 text-emerald-700" />
              <span>Tenho carro na troca</span>
            </button>
          </div>
        </div>

        {/* Direita: Campo opcional de modelo + Botão Verde WhatsApp */}
        <div className="w-full lg:w-[360px] shrink-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Qual veículo procura? (opcional)
            </label>
            <div className="relative">
              <CarFront className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={desiredVehicle}
                onChange={(e) => setDesiredVehicle(e.target.value)}
                placeholder="Ex: SUV automático, Corolla, Civic..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 fill-white text-emerald-600 shrink-0" />
            <span>Simular Agora no WhatsApp</span>
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Financiamento em até 60x • Sem compromisso</span>
          </p>
        </div>
      </div>
    </section>
  );
}
