"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  QrCode,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { OfferType } from "@/types";

interface MercadoPagoSubscribeButtonProps {
  tenantId: string;
  tenantName: string;
  userEmail?: string;
  payerName?: string;
  payerCpf?: string;
  offerType?: OfferType;
  type?: "setup" | OfferType;
  period?: "monthly" | "yearly";
  amount?: number;
  description?: string;
  label?: string;
  className?: string;
  size?: "default" | "lg";
  pixButtonText?: string;
  cardButtonText?: string;
  customAmount?: number;
  pixOnly?: boolean;
  onSuccess?: () => void;
}

interface PixPaymentData {
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  paymentId?: string | number;
  amount?: number;
}

const OFFER_DETAILS: Record<
  OfferType,
  {
    amount: number;
    formattedAmount: string;
    pixLabel: string;
    cardLabel: string;
    title: string;
  }
> = {
  setup: {
    amount: 197.0,
    formattedAmount: "R$ 197,00",
    pixLabel: "⚡ Pagar Setup via Pix Instantâneo (R$ 197,00)",
    cardLabel: "💳 Cartão de Crédito (em até 12x)",
    title: "Taxa de Implantação e Setup",
  },
  setup_monthly: {
    amount: 297.0,
    formattedAmount: "R$ 297,00",
    pixLabel: "⚡ Pagar via Pix (R$ 297,00)",
    cardLabel: "💳 Cartão de Crédito (em até 12x)",
    title: "Setup Profissional + 1º Mês",
  },
  semiannual: {
    amount: 497.0,
    formattedAmount: "R$ 497,00",
    pixLabel: "⚡ Pagar via Pix (R$ 497,00)",
    cardLabel: "💳 Cartão (em até 12x)",
    title: "Plano Semestral (Setup Grátis + 6 Meses)",
  },
  monthly_renewal: {
    amount: 97.0,
    formattedAmount: "R$ 97,00",
    pixLabel: "⚡ Pagar via Pix Instantâneo (R$ 97,00)",
    cardLabel: "💳 Pagar com Cartão de Crédito (em até 12x)",
    title: "Renovação Mensal",
  },
  yearly: {
    amount: 970.0,
    formattedAmount: "R$ 970,00",
    pixLabel: "⚡ Pagar Plano Anual via Pix Instantâneo (R$ 970,00)",
    cardLabel: "💳 Pagar Plano Anual no Cartão (em até 12x)",
    title: "Plano Anual Vitrine EssMendes",
  },
};

export function MercadoPagoSubscribeButton({
  tenantId,
  tenantName,
  userEmail = "",
  payerName = "",
  payerCpf = "",
  offerType: initialOfferType,
  type,
  period,
  amount: explicitAmount,
  description,
  pixButtonText,
  cardButtonText,
  customAmount,
  pixOnly = false,
  onSuccess,
  className = "",
}: MercadoPagoSubscribeButtonProps) {
  const router = useRouter();
  const [loadingMethod, setLoadingMethod] = useState<"pix" | "card" | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Resolução do tipo de oferta e valor efetivo
  const effectiveOfferType: OfferType =
    type && OFFER_DETAILS[type]
      ? type
      : initialOfferType && OFFER_DETAILS[initialOfferType]
      ? initialOfferType
      : period === "yearly"
      ? "yearly"
      : "monthly_renewal";

  const offerInfo = OFFER_DETAILS[effectiveOfferType] || OFFER_DETAILS.monthly_renewal;
  const effectiveAmount = explicitAmount || customAmount || offerInfo.amount;

  const handleCheckout = async (method: "pix" | "card") => {
    try {
      setLoadingMethod(method);
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
          method,
          offerType: effectiveOfferType,
          type: effectiveOfferType,
          period: period || (effectiveOfferType === "yearly" ? "yearly" : "monthly"),
          customAmount: effectiveAmount,
          amount: effectiveAmount,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível gerar a cobrança.");
      }

      // Se for pagamento via Cartão, redireciona para a preferência de Cartão
      if (method === "card") {
        const redirectUrl = data.checkoutUrl || data.init_point;
        if (!redirectUrl) {
          throw new Error("Link de checkout com cartão não retornado pelo servidor.");
        }
        window.location.href = redirectUrl;
        return;
      }

      // Se for pagamento via Pix, abre o modal com QR Code e Copia e Cola
      if (data.qrCode || data.qrCodeBase64) {
        setPixData({
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          ticketUrl: data.ticketUrl,
          paymentId: data.paymentId,
          amount: data.amount || effectiveAmount,
        });
        setLoadingMethod(null);
        return;
      }

      // Fallbacks para Pix
      if (data.ticketUrl) {
        window.location.href = data.ticketUrl;
        return;
      }

      if (data.checkoutUrl || data.init_point) {
        window.location.href = data.checkoutUrl || data.init_point;
        return;
      }

      throw new Error("Dados de pagamento não retornados pelo servidor.");
    } catch (err: any) {
      console.error("[MercadoPagoSubscribeButton] Erro ao processar pagamento:", err);
      setErrorMessage(err.message || "Erro de conexão ao comunicar com Mercado Pago.");
      setLoadingMethod(null);
    }
  };

  const handlePayWithCard = () => {
    handleCheckout("card");
  };

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

  // Função manual para verificar status e recarregar
  const checkPaymentStatus = useCallback(async () => {
    if (!pixData?.paymentId) {
      window.location.reload();
      return;
    }

    try {
      setCheckingStatus(true);
      const res = await fetch(
        `/api/billing/mp-status?paymentId=${pixData.paymentId}&tenantId=${tenantId}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.approved || json.status === "approved") {
          setIsApproved(true);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            router.refresh();
            window.location.reload();
          }, 1500);
          return;
        }
      }
    } catch (err) {
      console.warn("[MercadoPagoSubscribeButton] Erro na verificação manual de status:", err);
    } finally {
      setCheckingStatus(false);
    }

    // Se ainda não aprovado, recarrega para sincronizar
    router.refresh();
  }, [pixData?.paymentId, tenantId, onSuccess, router]);

  // Polling automático quando o modal com Pix estiver visível
  useEffect(() => {
    if (!pixData?.paymentId || isApproved) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/billing/mp-status?paymentId=${pixData.paymentId}&tenantId=${tenantId}`
        );
        if (!res.ok) return;
        const json = await res.json();

        if (json.approved || json.status === "approved") {
          if (!isMounted) return;
          setIsApproved(true);
          clearInterval(interval);

          if (onSuccess) {
            onSuccess();
          }

          // Dá tempo para o usuário ver a confirmação de aprovação e recarrega a página
          setTimeout(() => {
            router.refresh();
            window.location.reload();
          }, 1800);
        }
      } catch (err) {
        console.warn("[MercadoPagoSubscribeButton] Erro no polling de status:", err);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pixData?.paymentId, tenantId, isApproved, onSuccess, router]);

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Botões de Ação: Pix Individual ou Pix + Cartão */}
      {pixOnly ? (
        <button
          type="button"
          onClick={() => handleCheckout("pix")}
          disabled={!!loadingMethod}
          className="flex w-full items-center justify-center gap-2 rounded-xl font-bold text-white shadow-md transition py-4 px-5 text-sm sm:text-base bg-teal-700 hover:bg-teal-800 active:scale-[0.99] ring-2 ring-teal-600/30 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loadingMethod === "pix" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-teal-200 shrink-0" />
              <span>Gerando Pix Instantâneo...</span>
            </>
          ) : (
            <span>{pixButtonText || offerInfo.pixLabel}</span>
          )}
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {/* Botão 1: Pix Instantâneo */}
          <button
            type="button"
            onClick={() => handleCheckout("pix")}
            disabled={!!loadingMethod}
            className="flex w-full items-center justify-center gap-2 rounded-xl font-bold text-white shadow-md transition py-3.5 px-4 text-xs sm:text-sm bg-teal-700 hover:bg-teal-800 active:scale-[0.99] ring-2 ring-teal-600/30 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loadingMethod === "pix" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-teal-200 shrink-0" />
                <span>Gerando Pix...</span>
              </>
            ) : (
              <span>{pixButtonText || offerInfo.pixLabel}</span>
            )}
          </button>

          {/* Botão 2: Cartão de Crédito */}
          <button
            type="button"
            onClick={() => handleCheckout("card")}
            disabled={!!loadingMethod}
            className="flex w-full items-center justify-center gap-2 rounded-xl font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] shadow-sm transition py-3.5 px-4 text-xs sm:text-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loadingMethod === "card" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-500 shrink-0" />
                <span>Conectando ao Cartão...</span>
              </>
            ) : (
              <span>{cardButtonText || offerInfo.cardLabel}</span>
            )}
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 pt-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Ambiente Seguro Mercado Pago
        </span>
        <span>•</span>
        <span>{pixOnly ? "Pix Instantâneo com Baixa Automática" : "Pix Instantâneo ou Cartão em até 12x"}</span>
      </div>

      {/* Modal com QR Code Pix Transparente & Confirmação Automática */}
      {pixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Fechar modal */}
            <button
              type="button"
              onClick={() => {
                setPixData(null);
                setIsApproved(false);
              }}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Caso de Aprovação Imediata Confirmada (Webhook / Polling) */}
            {isApproved ? (
              <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Setup Concluído com Sucesso
                  </span>
                  <h3 className="text-xl font-black text-emerald-950 pt-2">
                    🎉 Pagamento Aprovado com Sucesso!
                  </h3>
                  <p className="text-xs text-emerald-800 max-w-xs mx-auto leading-relaxed">
                    Identificamos seu pagamento no Mercado Pago. Desbloqueando a vitrine imediatamente...
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>Atualizando painel administrativo...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Cabeçalho do Modal */}
                <div className="text-center space-y-1">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-4 ring-teal-50/50">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Pague via Pix Instantâneo
                  </h3>
                  <p className="text-xs font-semibold text-teal-800">
                    {description || offerInfo.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    Escaneie o QR Code ou copie o código Pix abaixo no app do seu banco.
                  </p>
                  <div className="pt-2 text-2xl font-black text-slate-900">
                    {pixData.amount
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(pixData.amount)
                      : offerInfo.formattedAmount}
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
                    onClick={checkPaymentStatus}
                    disabled={checkingStatus}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-75"
                  >
                    {checkingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-teal-200" />
                        <span>Verificando status...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Já fiz o pagamento / Atualizar status</span>
                      </>
                    )}
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

                {/* Link de contingência para Cartão de Crédito */}
                <div className="text-center pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handlePayWithCard}
                    disabled={loadingMethod === "card"}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 cursor-pointer"
                  >
                    {loadingMethod === "card"
                      ? "Conectando ao Cartão..."
                      : "Prefere pagar com cartão de crédito? Clique aqui."}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                  <Loader2 className="h-3 w-3 animate-spin text-teal-600" />
                  <span>Aguardando liquidação automática do Pix...</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
