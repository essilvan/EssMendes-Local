"use client";

import React, { useState } from "react";
import {
  CarFront,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Clock,
  FileText,
  Camera,
  ZoomIn,
  X,
  MessageCircle,
  MapPin,
  Phone,
  Loader2,
  Gauge,
  Fuel,
  AlertTriangle,
} from "lucide-react";
import { approvePublicVehicleQuoteAction } from "@/services/vehicle-quote.actions";
import { formatLicensePlateDisplay } from "@/lib/validations/vehicle-quote.schema";
import { sanitizePhoneNumber } from "@/utils/phone";
import type { VehicleQuote, VehicleInspection, VehicleQuotePart } from "@/types";

interface PublicQuoteApprovalClientProps {
  initialQuote: VehicleQuote;
  inspection: VehicleInspection | null;
  workshop: {
    name: string;
    slug: string;
    phone: string;
    address: string | null;
    logoUrl: string | null;
  };
}

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Em Análise Técnica",
    className: "bg-amber-500/20 text-amber-300 border-amber-400/30",
  },
  quoted: {
    label: "Aguardando Sua Aprovação",
    className: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  },
  approved: {
    label: "Orçamento Aprovado Online",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  },
  in_progress: {
    label: "Em Execução na Oficina",
    className: "bg-purple-500/20 text-purple-300 border-purple-400/30",
  },
  completed: {
    label: "Serviço Concluído",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  },
  canceled: {
    label: "Orçamento Cancelado",
    className: "bg-slate-500/20 text-slate-300 border-slate-400/30",
  },
};

export function PublicQuoteApprovalClient({
  initialQuote,
  inspection,
  workshop,
}: PublicQuoteApprovalClientProps) {
  const [quote, setQuote] = useState<VehicleQuote>(initialQuote);
  const [isApproving, setIsApproving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    caption: string;
  } | null>(null);

  const plateDisplay =
    quote.plate_display || formatLicensePlateDisplay(quote.license_plate);
  const partsCost = Number(quote.parts_cost) || 0;
  const laborCost = Number(quote.labor_cost) || 0;
  const totalCost = Number(quote.total_cost) || partsCost + laborCost;

  const partsList: VehicleQuotePart[] = Array.isArray(quote.parts_needed)
    ? quote.parts_needed
    : [];

  const damagedPhotos: string[] = Array.isArray(quote.damaged_parts_photos)
    ? quote.damaged_parts_photos.filter(Boolean)
    : [];

  const inspectionPhotos: string[] = Array.isArray(inspection?.photos)
    ? inspection!.photos!.filter(Boolean)
    : [];

  const isAlreadyApproved =
    quote.status === "approved" ||
    quote.status === "in_progress" ||
    quote.status === "completed";

  const formatCurrency = (val: number | null | undefined) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(val) || 0);

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApproveOnline = async () => {
    if (!quote.public_token || isApproving || isAlreadyApproved) return;
    setIsApproving(true);
    setErrorMsg(null);

    const res = await approvePublicVehicleQuoteAction(quote.public_token);
    setIsApproving(false);

    if (!res.success || !res.data) {
      setErrorMsg(
        res.error || "Não foi possível registrar a aprovação. Tente novamente."
      );
      return;
    }

    setQuote(res.data);
  };

  const buildWorkshopWhatsAppUrl = () => {
    const cleanPhone = sanitizePhoneNumber(workshop.phone);
    if (!cleanPhone) return null;
    const target = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const msg =
      `Olá, equipe *${workshop.name}*! 👋\n\n` +
      `Acabei de *APROVAR ONLINE* o orçamento do meu veículo:\n` +
      `🪪 *Placa:* ${plateDisplay}\n` +
      `🚘 *Veículo:* ${quote.vehicle_model || "Informado"}\n` +
      `💰 *Valor Total Aprovado:* ${formatCurrency(totalCost)}\n\n` +
      `Podem dar andamento no serviço!`;
    return `https://wa.me/${target}?text=${encodeURIComponent(msg)}`;
  };

  const whatsappUrl = buildWorkshopWhatsAppUrl();
  const statusInfo = STATUS_BADGE[quote.status] || STATUS_BADGE.pending;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 1. CABEÇALHO COM DADOS DA OFICINA, VEÍCULO E PLACA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3.5">
              {workshop.logoUrl ? (
                <img
                  src={workshop.logoUrl}
                  alt={workshop.name}
                  className="h-12 w-12 rounded-2xl object-cover border border-slate-700"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-lg shadow-lg shadow-blue-600/30">
                  <Wrench className="h-6 w-6" />
                </div>
              )}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 block">
                  Orçamento Técnico Digital
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {workshop.name}
                </h1>
                {workshop.address && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{workshop.address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-extrabold ${statusInfo.className}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{statusInfo.label}</span>
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Emitido em {formatDateTime(quote.created_at)}
              </span>
            </div>
          </div>

          {/* Dados do Veículo, Placa Mercosul e Cliente */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-slate-950/70 rounded-2xl p-4 sm:p-5 border border-slate-800/90">
            <div className="flex items-center gap-4">
              {/* Placa Mercosul */}
              <div className="rounded-xl border-2 border-slate-300 bg-white text-slate-950 overflow-hidden shadow-md shrink-0 min-w-[128px] text-center">
                <div className="bg-[#003399] text-white text-[9px] font-extrabold tracking-widest uppercase py-0.5 px-2.5 flex items-center justify-between">
                  <span>BR</span>
                  <span>BRASIL</span>
                </div>
                <div className="px-3 py-1.5 font-mono text-lg font-black tracking-widest">
                  {plateDisplay}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Veículo & Proprietário
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <CarFront className="h-5 w-5 text-blue-400 shrink-0" />
                  <span>{quote.vehicle_model || "Veículo em Avaliação"}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Cliente: <strong className="text-white">{quote.client_name}</strong>
                </p>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total do Orçamento
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {totalCost > 0 ? formatCurrency(totalCost) : "Em elaboração"}
              </span>
            </div>
          </div>
        </header>

        {/* 2. TABELA DISCRIMINANDO PEÇAS + MÃO DE OBRA & PARECER TÉCNICO */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <span>Discriminação de Peças & Mão de Obra</span>
            </h3>
          </div>

          {/* Relato e Diagnóstico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Solicitação / Sintoma Relatado
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {quote.complaint || "Avaliação técnica geral."}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-950/30 border border-blue-800/40 p-4 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block">
                Diagnóstico & Parecer Técnico da Oficina
              </span>
              <p className="text-sm text-slate-100 leading-relaxed">
                {quote.mechanic_notes ||
                  "Diagnóstico técnico concluído pela equipe da oficina."}
              </p>
            </div>
          </div>

          {/* Tabela Financeira Detalhada */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Item / Descrição</th>
                  <th className="py-3.5 px-4 text-center">Tipo</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {partsList.length > 0 &&
                  partsList.map((part, idx) => {
                    const qty = Number(part.quantity) || 1;
                    const unit = Number(part.unit_price) || 0;
                    const lineTotal = qty * unit;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {part.name}{" "}
                          {qty > 1 && (
                            <span className="text-xs text-slate-400">
                              ({qty}x)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                            Item / Peça
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-200">
                          {lineTotal > 0 ? formatCurrency(lineTotal) : "Incluso"}
                        </td>
                      </tr>
                    );
                  })}

                <tr className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-bold text-white">
                    Peças e Insumos Automotivos
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="rounded-md bg-blue-950/80 border border-blue-800/60 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                      Peças
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-white">
                    {formatCurrency(partsCost)}
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-bold text-white">
                    Mão de Obra Especializada & Serviços
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="rounded-md bg-amber-950/80 border border-amber-800/60 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                      Mão de Obra
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-white">
                    {formatCurrency(laborCost)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800 bg-slate-900">
                  <td
                    colSpan={2}
                    className="py-4 px-4 text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-200"
                  >
                    Valor Total do Orçamento
                  </td>
                  <td className="py-4 px-4 text-right text-xl sm:text-2xl font-black text-emerald-400">
                    {formatCurrency(totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* 3. FOTOS DAS PEÇAS DANIFICADAS / LAUDO VISUAL (COM CLIQUE PARA AMPLIAR) */}
        {damagedPhotos.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Camera className="h-5 w-5 text-amber-400" />
                  <span>Fotos das Peças Danificadas / Laudo Visual</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Toque ou clique em qualquer imagem abaixo para ampliar em tela cheia.
                </p>
              </div>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300">
                {damagedPhotos.length} foto(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {damagedPhotos.map((photoUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setLightboxPhoto({
                      url: photoUrl,
                      caption: `Evidência Técnica / Peça Danificada #${idx + 1} — Placa ${plateDisplay}`,
                    })
                  }
                  className="group relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <img
                    src={photoUrl}
                    alt={`Peça danificada ${idx + 1}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                    <span className="text-xs font-bold text-white">
                      Laudo Visual #{idx + 1}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white">
                      <ZoomIn className="h-3.5 w-3.5" />
                      Ampliar
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 3.1 RESUMO DO CHECKLIST DE ENTRADA (SE REGISTRADO PELA OFICINA) */}
        {inspection && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-7 space-y-4">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Gauge className="h-4 w-4 text-teal-400" />
              <span>Checklist Digital de Entrada do Veículo</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  KM de Entrada
                </span>
                <strong className="text-white text-sm font-extrabold">
                  {inspection.entry_km
                    ? `${Number(inspection.entry_km).toLocaleString("pt-BR")} km`
                    : "Não informado"}
                </strong>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Combustível
                </span>
                <strong className="text-white text-sm font-extrabold flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5 text-amber-400" />
                  {inspection.fuel_level || "—"}
                </strong>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Estepe Presente
                </span>
                <strong className="text-white text-sm font-extrabold">
                  {inspection.spare_tire ? "Sim" : "Não"}
                </strong>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Chave / Macaco
                </span>
                <strong className="text-white text-sm font-extrabold">
                  {inspection.jack_tool ? "Sim" : "Não"}
                </strong>
              </div>
            </div>

            {inspection.scratch_notes && (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-300">
                <strong className="text-slate-200 block mb-0.5">
                  Observações de Recebimento / Avarias Pré-existentes:
                </strong>
                {inspection.scratch_notes}
              </div>
            )}

            {inspectionPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {inspectionPhotos.map((url, idx) => {
                  const labels = [
                    "Frente",
                    "Traseira",
                    "Lateral Esquerda",
                    "Lateral Direita",
                  ];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setLightboxPhoto({
                          url,
                          caption: `Vistoria de Entrada (${labels[idx] || `Foto ${idx + 1}`})`,
                        })
                      }
                      className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer"
                    >
                      <img
                        src={url}
                        alt={labels[idx] || `Vistoria ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute bottom-1.5 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {labels[idx] || `Foto ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 4. BOTÃO VERDE DE DESTAQUE: "APROVAR ORÇAMENTO ONLINE" */}
        <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-2xl space-y-5 text-center">
          {errorMsg && (
            <div className="rounded-2xl bg-red-950/80 border border-red-500/40 p-4 text-xs font-bold text-red-200 flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isAlreadyApproved ? (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-emerald-400">
                  Orçamento Aprovado com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {quote.approved_at
                    ? `Aprovação registrada em ${formatDateTime(quote.approved_at)}.`
                    : "A oficina já recebeu a confirmação para iniciar o serviço no seu veículo."}
                </p>
              </div>

              {whatsappUrl && (
                <div className="pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <MessageCircle className="h-5 w-5 fill-white text-emerald-600" />
                    <span>Falar com a Oficina no WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1 max-w-xl mx-auto">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Autorizar Execução do Serviço
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Ao aprovar este orçamento online, a oficina{" "}
                  <strong>{workshop.name}</strong> será notificada imediatamente para iniciar o serviço no veículo de placa{" "}
                  <strong className="font-mono text-white">{plateDisplay}</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isApproving}
                  onClick={handleApproveOnline}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-600/30 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Registrando Aprovação...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-6 w-6" />
                      <span>Aprovar Orçamento Online</span>
                    </>
                  )}
                </button>

                {workshop.phone && (
                  <a
                    href={`https://wa.me/55${sanitizePhoneNumber(workshop.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition"
                  >
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>Tirar Dúvida no WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* MODAL LIGHTBOX PARA AMPLIAR FOTOS */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-150 select-none"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxPhoto(null);
            }}
            aria-label="Fechar"
            className="fixed top-4 right-4 z-[10000] bg-zinc-800/90 hover:bg-zinc-700 text-white p-3 rounded-full shadow-xl border border-zinc-600 transition-transform active:scale-95 cursor-pointer pointer-events-auto"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption}
              className="max-h-[80vh] w-auto rounded-2xl border border-white/15 object-contain shadow-2xl"
            />
            <p className="mt-3 text-xs sm:text-sm font-bold text-slate-200 text-center">
              {lightboxPhoto.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export default PublicQuoteApprovalClient;

