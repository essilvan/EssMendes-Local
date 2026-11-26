"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  Zap,
  Navigation,
  Loader2,
} from "lucide-react";
import { sanitizePhoneNumber } from "@/utils/phone";

interface TowingEmergencyCardProps {
  tenantName: string;
  phoneWhatsapp?: string | null;
  cityLabel?: string | null;
}

const PROBLEM_OPTIONS = [
  "Não liga / Pane Elétrica",
  "Pneu Furado",
  "Pane Seca / Carga de Bateria",
  "Acidente / Colisão",
  "Transporte / Viagem",
];

export function TowingEmergencyCard({
  tenantName,
  phoneWhatsapp,
  cityLabel,
}: TowingEmergencyCardProps) {
  const [vehicleModel, setVehicleModel] = useState("");
  const [problemType, setProblemType] = useState(PROBLEM_OPTIONS[0]);
  const [locationText, setLocationText] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const cleanPhone = sanitizePhoneNumber(phoneWhatsapp || "");
  const telHref = cleanPhone ? `tel:+${cleanPhone}` : undefined;

  const handleCaptureGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationText(
          `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`
        );
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCallWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `🚨 *SOLICITAÇÃO URGENTE DE GUINCHO 24H*`,
      `Empresa: *${tenantName}*`,
      `Veículo: ${vehicleModel.trim() || "A informar"}`,
      `Problema: ${problemType}`,
      locationText.trim()
        ? `Localização: ${locationText.trim()}`
        : `Localização: Vou enviar minha localização atual aqui pelo WhatsApp`,
      ``,
      `Pode enviar a previsão de chegada e valor?`,
    ];
    const encoded = encodeURIComponent(lines.join("\n"));
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="socorro-guincho"
      className="mb-8 rounded-3xl border border-red-500/35 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/50 p-5 sm:p-7 shadow-2xl text-white space-y-6"
    >
      {/* Cabeçalho de Emergência + Diferenciais de Resgate */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 border border-red-400/40 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-red-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Socorro Veicular & Guincho 24 Horas</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Precisa de guincho agora? Despacho imediato{" "}
          {cityLabel ? `em ${cityLabel}` : "no local"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Preencha os dados rápidos abaixo e envie sua localização pelo WhatsApp para atendimento emergencial sem filas.
        </p>

        {/* 4 Diferenciais de Resgate */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-100">
            <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Atendimento 24h</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-100">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Chegada Rápida</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-100">
            <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
            <span>Seguro Total no Transporte</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-100">
            <Truck className="h-4 w-4 text-red-400 shrink-0" />
            <span>Frota Plataforma</span>
          </div>
        </div>
      </div>

      {/* Formulário Rápido de Chamado */}
      <form
        onSubmit={handleCallWhatsApp}
        className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
      >
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Modelo do Veículo
          </label>
          <input
            type="text"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            placeholder="Ex: Onix, Corolla, Moto..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Tipo de Problema
          </label>
          <select
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            {PROBLEM_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Onde você está? (Opcional)
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Rua, BR ou ponto de ref."
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCaptureGps}
              disabled={isLocating}
              title="Usar minha localização GPS"
              className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 text-emerald-400 transition cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Enviar Localização e Chamar no WhatsApp</span>
          </button>

          {telHref && (
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/50 bg-red-600/20 hover:bg-red-600/35 px-5 py-3.5 text-sm font-extrabold text-red-100 transition shrink-0"
            >
              <Phone className="h-4 w-4 text-red-300" />
              <span>Ligar Urgente 24h</span>
            </a>
          )}
        </div>
      </form>
    </section>
  );
}
