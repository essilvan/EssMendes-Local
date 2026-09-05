"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  QrCode,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface MercadoPagoSubscribeButtonProps {
  tenantId: string;
  tenantName: string;
  userEmail?: string;
  payerName?: string;
  payerCpf?: string;
  label?: string;
  className?: string;
  size?: "default" | "lg";
}

interface PixPaymentData {
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  paymentId?: string | number;
}

export function MercadoPagoSubscribeButton({
  tenantId,
  tenantName,
  userEmail = "",
  payerName = "",
  payerCpf = "",
  label = "Renovar / Assinar Plano Mensal (R$ 97,00) via Pix Instantâneo",
  className = "",
  size = "lg",
}: MercadoPagoSubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/billing/mp-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          tenantName,
          email: userEmail,
          payerName,
          payerCpf,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível gerar a cobrança Pix.");
      }

      // Se retornou dados do Pix transparente direto
      if (data.qrCode || data.qrCodeBase64) {
        setPixData({
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          ticketUrl: data.ticketUrl,
          paymentId: data.paymentId,
        });
        setLoading(false);
        return;
      }

      // Se retornou init_point (Checkout Pro fallback)
      if (data.init_point) {
        window.location.href = data.init_point;
        return;
      }

      // Se retornou ticketUrl
      if (data.ticketUrl) {
        window.location.href = data.ticketUrl;
        return;
      }

      throw new Error("Dados de pagamento não retornados pelo servidor.");
    } catch (err: any) {
      console.error("[MercadoPagoSubscribeButton] Erro ao gerar Pix:", err);
      setErrorMessage(err.message || "Erro de conexão ao comunicar com Mercado Pago.");
      setLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback simples
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

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={cn(
          "flex w-full items-center justify-center gap-2.5 rounded-xl font-bold text-white shadow-md transition cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed",
          size === "lg" ? "px-6 py-3.5 text-sm sm:text-base" : "px-4 py-2.5 text-xs sm:text-sm",
          "bg-teal-700 hover:bg-teal-800 active:scale-[0.99] ring-2 ring-teal-600/30",
          className
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin shrink-0 text-teal-200" />
            <span>Gerando Pix no Mercado Pago...</span>
          </>
        ) : (
          <>
            <QrCode className="h-5 w-5 shrink-0 text-teal-200" />
            <span>{label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-teal-300 ml-1 hidden sm:inline" />
          </>
        )}
      </button>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 pt-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Pix Direto & Seguro Mercado Pago
        </span>
        <span>•</span>
        <span>Liberação Imediata</span>
      </div>

      {/* Modal / Card com QR Code Pix Transparente */}
      {pixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Fechar modal */}
            <button
              type="button"
              onClick={() => setPixData(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cabeçalho */}
            <div className="text-center space-y-1">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-4 ring-teal-50/50">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Pague via Pix Instantâneo
              </h3>
              <p className="text-xs text-slate-500">
                Escaneie o QR Code ou copie o código Pix abaixo no app do seu banco.
              </p>
              <div className="pt-2 text-2xl font-black text-slate-900">
                R$ 97,00
              </div>
            </div>

            {/* QR Code Imagem */}
            {pixData.qrCodeBase64 && (
              <div className="flex justify-center">
                <div className="rounded-xl border border-slate-200 p-2 bg-white shadow-sm">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="h-48 w-48 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Código Copia e Cola */}
            {pixData.qrCode && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Pix Copia e Cola:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixData.qrCode}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 font-mono select-all focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap text-white cursor-pointer shadow-sm",
                      copied
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-teal-700 hover:bg-teal-800"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Ações pós-pagamento */}
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Já fiz o pagamento / Atualizar status</span>
              </button>

              {pixData.ticketUrl && (
                <a
                  href={pixData.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition"
                >
                  <span>Abrir comprovante do Mercado Pago</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Assim que confirmado pelo seu banco, a liberação é automática.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
