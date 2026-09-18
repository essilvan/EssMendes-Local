"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Lock,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface PublicInvoiceTenant {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  setup_fee_amount?: number | null;
}

export interface PublicInvoicePixData {
  paymentId: string;
  qrCode: string;
  qrCodeBase64?: string;
  amount: number;
}

interface PublicInvoiceClientProps {
  tenant: PublicInvoiceTenant;
  initialPix: PublicInvoicePixData | null;
  isAlreadyPaid: boolean;
}

export function PublicInvoiceClient({
  tenant,
  initialPix,
  isAlreadyPaid,
}: PublicInvoiceClientProps) {
  const [isPaid, setIsPaid] = useState(isAlreadyPaid);
  const [pixData, setPixData] = useState<PublicInvoicePixData | null>(initialPix);
  const [isLoadingPix, setIsLoadingPix] = useState(!initialPix && !isAlreadyPaid);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Valor formatado em Reais
  const amountToFormat = pixData?.amount ?? tenant.setup_fee_amount ?? 197.0;
  const formattedAmount = Number(amountToFormat).toFixed(2).replace(".", ",");

  // Geração do Pix no cliente caso não tenha vindo do servidor
  const generatePix = useCallback(async () => {
    if (isPaid) return;
    try {
      setIsLoadingPix(true);
      setErrorMessage(null);

      const setupAmount =
        tenant.setup_fee_amount !== null && tenant.setup_fee_amount !== undefined
          ? Number(tenant.setup_fee_amount)
          : 197.0;

      const response = await fetch("/api/billing/mp-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          tenantName: tenant.name,
          method: "pix",
          offerType: "setup",
          type: "setup",
          amount: setupAmount,
          description: `Taxa de Implantação e Otimização - ${tenant.name}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível gerar a cobrança Pix no Mercado Pago.");
      }

      if (!data.qrCode) {
        throw new Error("Mercado Pago não retornou o código Pix.");
      }

      setPixData({
        paymentId: String(data.paymentId),
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        amount: Number(data.amount) || setupAmount,
      });
    } catch (err: any) {
      console.error("[PublicInvoice] Erro ao gerar Pix:", err);
      setErrorMessage(err.message || "Erro de conexão ao gerar cobrança Pix.");
    } finally {
      setIsLoadingPix(false);
    }
  }, [tenant, isPaid]);

  useEffect(() => {
    if (!pixData && !isPaid) {
      generatePix();
    }
  }, [pixData, isPaid, generatePix]);

  // Polling em tempo real a cada 3,5 segundos para confirmação automática de pagamento
  useEffect(() => {
    if (isPaid || !pixData?.paymentId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/billing/mp-status?paymentId=${pixData.paymentId}&tenantId=${tenant.id}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.approved || data.status === "approved" || data.isSetupPaid) {
          setIsPaid(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.warn("[PublicInvoice] Erro no polling de verificação:", err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaid, pixData?.paymentId, tenant.id]);

  // Função para copiar apenas o código Pix Copia e Cola
  const handleCopy = async () => {
    if (!pixData?.qrCode) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pixData.qrCode);
      } else {
        throw new Error("Clipboard indisponível");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = pixData.qrCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Background Decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
        {/* Card Central Branco Elegante */}
        <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100/10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Topo: Identificação e Segurança */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>EssMendes Tecnologia • Cobrança Segura</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
              Ativação de Vitrine Oficial
            </h1>
            <p className="text-xs text-slate-500 max-w-xs">
              Implantação e Otimização da presença oficial do seu negócio no Google
            </p>
          </div>

          {/* Nome da Empresa em Destaque */}
          <div className="rounded-2xl bg-teal-50/80 border border-teal-200/70 p-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700/80 block">
              Empresa Beneficiária
            </span>
            <h2 className="text-base sm:text-lg font-black text-teal-950 mt-0.5 break-words">
              {tenant.name}
            </h2>
          </div>

          {/* Valor em Evidência */}
          <div className="text-center py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Valor da Fatura
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-950 mt-0.5">
              R$ {formattedAmount}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">
              Taxa Única de Setup & Otimização Google
            </span>
          </div>

          {/* Cenário A: Fatura Paga com Sucesso */}
          {isPaid ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 p-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 shadow-xs">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-emerald-950">
                  Fatura Paga com Sucesso!
                </h3>
                <p className="text-xs font-semibold text-emerald-800 max-w-xs mx-auto">
                  A taxa de ativação da empresa <strong>{tenant.name}</strong> foi validada e a sua vitrine já está liberada.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-900 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Status: Setup Quitado & Vitrine Ativa</span>
              </div>

              <div className="pt-2">
                <a
                  href={`/${tenant.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] px-4 py-3.5 text-xs font-black text-white shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <span>Visitar Vitrine Oficial</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            /* Cenário B: Fatura Pendente */
            <div className="space-y-5">
              {/* Carregando dados do Pix */}
              {isLoadingPix && (
                <div className="py-10 text-center space-y-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Gerando QR Code Pix seguro...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Conectando com o Mercado Pago Oficial
                  </p>
                </div>
              )}

              {/* Erro ao gerar Pix */}
              {errorMessage && !isLoadingPix && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-3 text-xs text-rose-900">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Não foi possível gerar a cobrança Pix</span>
                  </div>
                  <p>{errorMessage}</p>
                  <button
                    type="button"
                    onClick={generatePix}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Tentar Novamente</span>
                  </button>
                </div>
              )}

              {/* QR Code e Botão de Cópia */}
              {!isLoadingPix && !errorMessage && pixData && (
                <>
                  {/* Container do QR Code */}
                  <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs">
                    {pixData.qrCodeBase64 ? (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <img
                          src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                          alt="QR Code Pix Mercado Pago"
                          className="h-44 w-44 object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="flex h-44 w-44 items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400">
                        <QrCode className="h-14 w-14" />
                      </div>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500 mt-2.5">
                      Aponte a câmera no aplicativo do seu banco
                    </span>
                  </div>

                  {/* Botão Verde Grande: Copiar Código Pix Copia e Cola */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-black text-white shadow-md hover:shadow-lg active:scale-[0.99] transition cursor-pointer",
                      copied
                        ? "bg-emerald-700 ring-2 ring-emerald-400"
                        : "bg-emerald-600 hover:bg-emerald-500 ring-1 ring-emerald-500/20"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Código copiado! Cole no seu banco</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>📋 Copiar Código Pix Copia e Cola</span>
                      </>
                    )}
                  </button>

                  {/* Indicador de Status com Polling */}
                  <div className="flex items-center justify-center gap-2 text-center text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl py-2 px-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    <span>Aguardando pagamento... (atualização automática em tempo real)</span>
                  </div>

                  {/* Instruções Simplificadas */}
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 space-y-1.5 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800 block">
                      Como pagar em 3 passos:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                      <li>Toque no botão verde acima para copiar o código Pix.</li>
                      <li>Abra o app do seu banco e escolha <strong>Pix Copia e Cola</strong>.</li>
                      <li>Cole o código e conclua. O sistema identifica e ativa a vitrine na hora!</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Rodapé de Segurança Mercado Pago */}
          <div className="border-t border-slate-100 pt-4 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span>Pagamento processado via Mercado Pago Oficial</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Ambiente criptografado com certificação SSL de 256 bits.
            </p>
          </div>
        </div>

        {/* Rodapé Externo */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} EssMendes Tecnologia • Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
