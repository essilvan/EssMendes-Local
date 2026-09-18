"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  ExternalLink,
  MessageCircle,
  Phone,
  Store,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface AdminPixBillingTenant {
  id: string;
  name: string;
  slug?: string;
  phone?: string | null;
  contact_email?: string | null;
  setup_fee_amount?: number | null;
  setup_fee_paid?: boolean | null;
  setup_paid?: boolean | null;
}

interface AdminPixBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: AdminPixBillingTenant | null;
  onPaymentApproved?: (tenantId: string) => void;
}

interface PixData {
  paymentId: string | number;
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  amount: number;
}

export function AdminPixBillingModal({
  isOpen,
  onClose,
  tenant,
  onPaymentApproved,
}: AdminPixBillingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [clientPhone, setClientPhone] = useState("");

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Formata o telefone removendo caracteres não numéricos e adicionando DDI 55 se necessário
  const cleanPhoneForWhatsApp = (raw: string): string => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) return "";
    if (cleaned.startsWith("55") && (cleaned.length === 12 || cleaned.length === 13)) {
      return cleaned;
    }
    if (cleaned.length === 10 || cleaned.length === 11) {
      return `55${cleaned}`;
    }
    return cleaned;
  };

  const generatePix = useCallback(async (targetTenant: AdminPixBillingTenant) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setPixData(null);
      setIsApproved(false);

      const setupAmount =
        targetTenant.setup_fee_amount !== null && targetTenant.setup_fee_amount !== undefined
          ? Number(targetTenant.setup_fee_amount)
          : 197.00;

      const response = await fetch("/api/billing/mp-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: targetTenant.id,
          tenantName: targetTenant.name,
          email: targetTenant.contact_email,
          method: "pix",
          offerType: "setup",
          type: "setup",
          amount: setupAmount,
          description: `Taxa de Implantação e Otimização - ${targetTenant.name}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível gerar a cobrança no Mercado Pago.");
      }

      if (!data.qrCode && !data.qrCodeBase64) {
        throw new Error("Mercado Pago não retornou os dados do Pix.");
      }

      setPixData({
        paymentId: data.paymentId,
        qrCode: data.qrCode || "",
        qrCodeBase64: data.qrCodeBase64,
        ticketUrl: data.ticketUrl,
        amount: Number(data.amount) || setupAmount,
      });
    } catch (err: any) {
      console.error("[AdminPixBillingModal] Erro ao gerar Pix:", err);
      setErrorMessage(err.message || "Erro de conexão ao gerar o Pix.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inicializa quando o modal abre
  useEffect(() => {
    if (isOpen && tenant) {
      setClientPhone(tenant.phone || "");
      setCopied(false);
      setIsApproved(false);
      generatePix(tenant);
    } else {
      setPixData(null);
      setErrorMessage(null);
      setIsApproved(false);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [isOpen, tenant, generatePix]);

  // Polling em tempo real a cada 3 segundos para detecção de aprovação
  useEffect(() => {
    if (!isOpen || !pixData?.paymentId || !tenant || isApproved) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/billing/mp-status?paymentId=${pixData.paymentId}&tenantId=${tenant.id}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.approved || data.status === "approved") {
          setIsApproved(true);
          clearInterval(interval);
          pollingRef.current = null;

          if (onPaymentApproved) {
            onPaymentApproved(tenant.id);
          }
        }
      } catch (err) {
        console.warn("[AdminPixBillingModal] Erro no polling de verificação:", err);
      }
    }, 3000);

    pollingRef.current = interval;

    return () => {
      clearInterval(interval);
      pollingRef.current = null;
    };
  }, [isOpen, pixData?.paymentId, tenant, isApproved, onPaymentApproved]);

  // Checagem manual
  const handleCheckManual = async () => {
    if (!pixData?.paymentId || !tenant) return;
    try {
      setIsCheckingManual(true);
      const res = await fetch(
        `/api/billing/mp-status?paymentId=${pixData.paymentId}&tenantId=${tenant.id}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.approved || data.status === "approved") {
          setIsApproved(true);
          if (onPaymentApproved) {
            onPaymentApproved(tenant.id);
          }
        }
      }
    } catch (err) {
      console.warn("[AdminPixBillingModal] Erro ao checar status manualmente:", err);
    } finally {
      setIsCheckingManual(false);
    }
  };

  // Copiar código Pix
  const handleCopyPix = async () => {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = pixData.qrCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Enviar mensagem formatada no WhatsApp
  const handleSendWhatsApp = () => {
    if (!tenant || !pixData?.qrCode) return;

    const formattedAmount = Number(pixData.amount || 197).toFixed(2).replace(".", ",");
    const message =
      `Olá! Segue o código Pix para ativação e implantação da sua vitrine oficial no Google:\n\n` +
      `🏢 Empresa: ${tenant.name}\n` +
      `💰 Valor: R$ ${formattedAmount} (Taxa Única de Setup e Otimização)\n\n` +
      `📋 *Pix Copia e Cola:*\n${pixData.qrCode}\n\n` +
      `Basta copiar o código acima, abrir o app do seu banco na opção 'Pix Copia e Cola' e confirmar o pagamento. Assim que compensar, o sistema valida automaticamente!`;

    const cleaned = cleanPhoneForWhatsApp(clientPhone);
    let waUrl = "";
    if (cleaned) {
      waUrl = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    } else {
      waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }

    window.open(waUrl, "_blank");
  };

  if (!isOpen || !tenant) return null;

  const formattedAmount = Number(pixData?.amount || tenant.setup_fee_amount || 197)
    .toFixed(2)
    .replace(".", ",");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mercado Pago Pix Oficial</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>⚡ Cobrança de Setup</span>
              <span className="text-sm font-semibold text-slate-500">
                — {tenant.name}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Gere o Pix de ativação instantâneo e envie diretamente no WhatsApp do cliente.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Estado 1: Carregando geração do Pix */}
        {isLoading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">
              Gerando Pix de R$ {formattedAmount} no Mercado Pago...
            </p>
            <p className="text-xs text-slate-500">
              Comunicando com a API oficial do Mercado Pago para gerar QR Code e Copia e Cola.
            </p>
          </div>
        )}

        {/* Estado 2: Erro */}
        {errorMessage && !isLoading && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Não foi possível gerar a cobrança Pix</span>
            </div>
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => generatePix(tenant)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

        {/* Estado 3: Pagamento Aprovado com Sucesso! */}
        {isApproved && (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-emerald-950">
                ✅ Pagamento Identificado com Sucesso!
              </h3>
              <p className="text-xs font-semibold text-emerald-800 max-w-md mx-auto">
                A taxa de setup de <strong>R$ {formattedAmount}</strong> da empresa{" "}
                <strong>{tenant.name}</strong> foi validada e quitada automaticamente no sistema.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-900 shadow-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Status Atualizado: Setup Quitado</span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
              >
                Concluir e Fechar Janela
              </button>
            </div>
          </div>
        )}

        {/* Estado 4: Pix Gerado e Pronto para Envio / Pagamento */}
        {!isLoading && !errorMessage && !isApproved && pixData && (
          <div className="space-y-5">
            {/* Card Resumo do Estabelecimento e Valor */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3.5">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Valor da Taxa de Setup
                </span>
                <p className="text-2xl font-black text-slate-900">
                  R$ {formattedAmount}
                </p>
                <span className="text-[11px] text-slate-400">
                  ID Transação MP: #{pixData.paymentId}
                </span>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Aguardando Pagamento</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Sincronização em tempo real ativa
                </p>
              </div>
            </div>

            {/* Seção Destaque 1: Disparo Direto no WhatsApp */}
            <div className="rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-50/60 to-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>Enviar Cobrança Imediata no WhatsApp</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>Número de WhatsApp do Lojista (com DDD):</span>
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321 ou 11987654321"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400">
                  * Você pode alterar o número acima antes de clicar em enviar.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] px-4 py-3 text-xs font-black text-white shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>📲 Enviar Cobrança no WhatsApp do Cliente</span>
              </button>
            </div>

            {/* Seção Destaque 2: QR Code e Código Pix Copia e Cola */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              {/* QR Code Imagem */}
              <div className="flex flex-col items-center justify-center text-center p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                {pixData.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix Mercado Pago"
                    className="h-36 w-36 object-contain"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                    <QrCode className="h-12 w-12" />
                  </div>
                )}
                <span className="text-[10px] font-semibold text-slate-400 mt-1">
                  Aponte a câmera no app do banco
                </span>
              </div>

              {/* Botão Copiar Código Pix */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700">
                  Pix Copia e Cola:
                </span>
                <div className="relative">
                  <textarea
                    readOnly
                    value={pixData.qrCode}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-[10px] font-mono text-slate-600 focus:outline-none select-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopyPix}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition shadow-xs cursor-pointer",
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Código Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Código Pix</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer com checagem manual e status */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleCheckManual}
                disabled={isCheckingManual}
                className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-900 disabled:opacity-50 transition cursor-pointer"
              >
                {isCheckingManual ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>Verificar Pagamento Agora</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
