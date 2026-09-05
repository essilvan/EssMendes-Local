"use client";

import React, { useState } from "react";
import { CreditCard, Loader2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";

interface MercadoPagoSubscribeButtonProps {
  tenantId: string;
  tenantName: string;
  userEmail?: string;
  label?: string;
  className?: string;
  size?: "default" | "lg";
}

export function MercadoPagoSubscribeButton({
  tenantId,
  tenantName,
  userEmail = "",
  label = "Renovar / Assinar Plano Mensal (R$ 97,00) via Pix ou Cartão",
  className = "",
  size = "lg",
}: MercadoPagoSubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.init_point) {
        throw new Error(data.error || "Não foi possível gerar a sessão de pagamento.");
      }

      // Redireciona imediatamente para o Checkout Pro seguro do Mercado Pago
      window.location.href = data.init_point;
    } catch (err: any) {
      console.error("[MercadoPagoSubscribeButton] Erro ao iniciar checkout:", err);
      setErrorMessage(err.message || "Erro de conexão ao comunicar com Mercado Pago.");
      setLoading(false);
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
            <span>Conectando ao Mercado Pago Seguro...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 shrink-0 text-teal-200" />
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
          Ambiente Seguro Mercado Pago
        </span>
        <span>•</span>
        <span>Pix Instantâneo ou Cartão de Crédito</span>
      </div>
    </div>
  );
}
