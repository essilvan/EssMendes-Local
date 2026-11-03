"use client";

import React, { useState } from "react";
import {
  CarFront,
  Wrench,
  X,
  CheckCircle2,
  MessageCircle,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Gauge,
  User,
  Phone,
  FileText,
} from "lucide-react";
import { createPublicVehicleQuoteAction } from "@/services/vehicle-quote.actions";
import {
  formatLicensePlateDisplay,
  normalizeLicensePlate,
} from "@/lib/validations/vehicle-quote.schema";
import { sanitizePhoneNumber } from "@/utils/phone";

interface VehicleQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  phoneWhatsapp?: string | null;
  brandColor?: string;
}

const QUICK_SYMPTOM_TAGS = [
  "Revisão Preventiva",
  "Troca de Óleo e Filtros",
  "Freios / Pastilhas",
  "Suspensão / Barulho",
  "Motor / Falhando",
  "Luz de Injeção / Scanner",
  "Elétrica / Bateria",
  "Alinhamento e Pneus",
  "Embreagem / Câmbio",
  "Ar-Condicionado",
];

function maskPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function VehicleQuoteModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  phoneWhatsapp,
  brandColor = "#2563eb",
}: VehicleQuoteModalProps) {
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [complaint, setComplaint] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedQuote, setSubmittedQuote] = useState<{
    plateDisplay: string;
    vehicleModel: string;
    complaint: string;
    clientName: string;
    clientPhone: string;
    categoryTags: string[];
  } | null>(null);

  if (!isOpen) return null;

  const displayPlatePreview =
    formatLicensePlateDisplay(licensePlate) || "ABC1D23";

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const clean = raw.replace(/-/g, "").slice(0, 7);
    if (/^[A-Z]{3}[0-9]{1,4}$/.test(clean) && clean.length > 3) {
      setLicensePlate(`${clean.slice(0, 3)}-${clean.slice(3)}`);
    } else {
      setLicensePlate(clean);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleReset = () => {
    setLicensePlate("");
    setVehicleModel("");
    setComplaint("");
    setSelectedTags([]);
    setClientName("");
    setClientPhone("");
    setErrorMessage(null);
    setSubmittedQuote(null);
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPlate = normalizeLicensePlate(licensePlate);
    if (cleanPlate.length < 6) {
      setErrorMessage(
        "Informe uma placa válida (ex: ABC-1234 ou padrão Mercosul ABC1D23)."
      );
      return;
    }

    if (!vehicleModel.trim() || vehicleModel.trim().length < 2) {
      setErrorMessage("Informe o modelo e ano do veículo (ex: Honda Civic 2020).");
      return;
    }

    const effectiveComplaint =
      complaint.trim() ||
      (selectedTags.length > 0
        ? `Solicitação de orçamento para: ${selectedTags.join(", ")}.`
        : "");

    if (!effectiveComplaint || effectiveComplaint.length < 3) {
      setErrorMessage("Descreva o problema do veículo ou selecione os itens acima.");
      return;
    }

    if (!clientName.trim() || clientName.trim().length < 2) {
      setErrorMessage("Informe seu nome para identificação.");
      return;
    }

    const cleanClientDigits = clientPhone.replace(/\D/g, "");
    if (cleanClientDigits.length < 10) {
      setErrorMessage("Informe um número de WhatsApp válido com DDD.");
      return;
    }

    setIsSubmitting(true);

    const res = await createPublicVehicleQuoteAction({
      tenantId,
      licensePlate: cleanPlate,
      vehicleModel: vehicleModel.trim(),
      complaint: effectiveComplaint,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      categoryTags: selectedTags,
    });

    setIsSubmitting(false);

    if (!res.success || !res.data) {
      setErrorMessage(
        res.error || "Não foi possível salvar o orçamento. Tente novamente."
      );
      return;
    }

    setSubmittedQuote({
      plateDisplay: res.data.plate_display || formatLicensePlateDisplay(cleanPlate),
      vehicleModel: vehicleModel.trim(),
      complaint: effectiveComplaint,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      categoryTags: res.data.category_tags || selectedTags,
    });
  };

  // Monta URL do WhatsApp com resumo preenchido para adiantar conversa na oficina
  const buildWorkshopWhatsAppUrl = () => {
    if (!submittedQuote) return "#";
    const cleanShopPhone = sanitizePhoneNumber(phoneWhatsapp || "");
    const targetPhone = cleanShopPhone
      ? cleanShopPhone.startsWith("55")
        ? cleanShopPhone
        : `55${cleanShopPhone}`
      : "";

    const tagsLine =
      submittedQuote.categoryTags.length > 0
        ? `\n🏷️ *Categorias:* ${submittedQuote.categoryTags.join(", ")}`
        : "";

    const message =
      `Olá, equipe *${tenantName}*! 🚗🔧\n` +
      `Acabei de solicitar um *Orçamento do Veículo por Placa* pelo site:\n\n` +
      `🪪 *Placa:* ${submittedQuote.plateDisplay}\n` +
      `🚘 *Modelo/Ano:* ${submittedQuote.vehicleModel}\n` +
      `🛠️ *Descrição do Problema:* ${submittedQuote.complaint}${tagsLine}\n` +
      `👤 *Cliente:* ${submittedQuote.clientName}\n` +
      `📱 *WhatsApp:* ${submittedQuote.clientPhone}\n\n` +
      `Podemos adiantar a avaliação e o orçamento por aqui?`;

    const encoded = encodeURIComponent(message);
    return targetPhone
      ? `https://wa.me/${targetPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-quote-modal-title"
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 text-slate-100 shadow-2xl shadow-black/70 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Accent Header */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-5 sm:px-7 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              <CarFront className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                <Gauge className="h-3.5 w-3.5" />
                <span>Diagnóstico & Triagem Rápida</span>
              </div>
              <h2
                id="vehicle-quote-modal-title"
                className="text-lg sm:text-xl font-extrabold text-white tracking-tight"
              >
                Solicitar Orçamento do Veículo
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
          {submittedQuote ? (
            /* TELA DE SUCESSO COM BOTÃO DIRETO PARA WHATSAPP DA OFICINA */
            <div className="space-y-6 py-2 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Ficha Técnica Registrada na Oficina</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Orçamento Solicitado com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Os dados do seu veículo já estão salvos no sistema de{" "}
                  <strong className="text-white">{tenantName}</strong>. Clique abaixo
                  para adiantar a conversa direto no WhatsApp da oficina com o resumo
                  preenchido:
                </p>
              </div>

              {/* Card Resumo com Placa estilo Mercosul */}
              <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 text-left space-y-3.5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Veículo Identificado
                    </span>
                    <p className="text-sm sm:text-base font-extrabold text-white">
                      {submittedQuote.vehicleModel}
                    </p>
                  </div>

                  {/* Mini Placa Mercosul */}
                  <div className="rounded-lg border-2 border-slate-300 bg-white text-slate-950 overflow-hidden shadow-md shrink-0 min-w-[116px] text-center">
                    <div className="bg-[#003399] text-white text-[8px] font-bold tracking-widest uppercase py-0.5 px-2 flex items-center justify-between">
                      <span>BR</span>
                      <span>BRASIL</span>
                    </div>
                    <div className="px-2.5 py-1 font-mono text-sm font-black tracking-widest">
                      {submittedQuote.plateDisplay}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Descrição do Problema / Serviço
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {submittedQuote.complaint}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <span>
                    👤 <strong className="text-slate-200">{submittedQuote.clientName}</strong>
                  </span>
                  <span>
                    📱 <strong className="text-slate-200">{submittedQuote.clientPhone}</strong>
                  </span>
                </div>
              </div>

              {/* Botão Principal: Adiantar conversa no WhatsApp da oficina */}
              <div className="space-y-3 pt-1">
                <a
                  href={buildWorkshopWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base px-6 py-4 shadow-xl shadow-emerald-600/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <MessageCircle className="h-5 w-5 fill-white text-emerald-600 shrink-0" />
                  <span>Adiantar Conversa no WhatsApp da Oficina</span>
                </a>

                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    Solicitar para outro veículo
                  </button>
                  <span className="text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Voltar para a vitrine
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO DE SOLICITAÇÃO POR PLACA */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Linha 1: Placa + Preview Mercosul e Modelo/Ano */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                <div className="sm:col-span-5 space-y-1.5">
                  <label
                    htmlFor="quote-license-plate"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Placa do Veículo *
                  </label>
                  <div className="relative">
                    <input
                      id="quote-license-plate"
                      type="text"
                      required
                      maxLength={8}
                      value={licensePlate}
                      onChange={handlePlateChange}
                      placeholder="ABC1D23 ou ABC-1234"
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-base font-black uppercase tracking-widest text-white placeholder:text-slate-600 placeholder:font-sans placeholder:text-xs placeholder:tracking-normal focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-[#003399] px-1.5 py-0.5 text-[9px] font-extrabold text-white tracking-wider">
                      BR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Preview:{" "}
                    <strong className="font-mono text-blue-400">
                      {displayPlatePreview}
                    </strong>
                  </p>
                </div>

                <div className="sm:col-span-7 space-y-1.5">
                  <label
                    htmlFor="quote-vehicle-model"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Modelo / Ano *
                  </label>
                  <input
                    id="quote-vehicle-model"
                    type="text"
                    required
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Ex: Honda Civic 2.0 2020, Gol 1.6 2019"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    Informe marca, modelo, motorização (se souber) e ano.
                  </p>
                </div>
              </div>

              {/* Atalhos Rápidos de Sintomas / Serviços */}
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  O que o veículo precisa? (Opcional)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SYMPTOM_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer border ${
                          active
                            ? "bg-blue-600/25 border-blue-500 text-blue-300 shadow-2xs"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {active ? `✓ ${tag}` : tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descrição do Problema */}
              <div className="space-y-1.5">
                <label
                  htmlFor="quote-complaint"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  <span>Descrição do Problema ou Serviço *</span>
                </label>
                <textarea
                  id="quote-complaint"
                  rows={3}
                  required
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Descreva os sintomas (ex: barulho ao frear, luz de injeção acesa, revisão de 50.000 km, troca de óleo e filtros...)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Nome e WhatsApp do Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="quote-client-name"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
                  >
                    <User className="h-3.5 w-3.5 text-blue-400" />
                    <span>Seu Nome *</span>
                  </label>
                  <input
                    id="quote-client-name"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Como podemos te chamar?"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="quote-client-phone"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Seu WhatsApp *</span>
                  </label>
                  <input
                    id="quote-client-phone"
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(maskPhoneInput(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rodapé do Formulário */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Histórico vinculado à placa para sua segurança</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-extrabold text-sm px-6 py-3.5 shadow-lg shadow-blue-600/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Registrando Orçamento...</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="h-4 w-4" />
                      <span>Solicitar Orçamento do Veículo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleQuoteModal;

