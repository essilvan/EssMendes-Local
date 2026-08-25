"use client";

import React, { useState } from "react";
import { Copy, Check, ArrowRight, Gift } from "lucide-react";

interface PromotionalBannerProps {
  couponCode?: string;
  title?: string;
  description?: string;
  discountBadge?: string;
  onOpenBooking: () => void;
}

export function PromotionalBanner({
  couponCode = "PROMO",
  title = "Condição Especial no seu Agendamento Online",
  description = "Agende pelo nosso site e utilize o cupom de desconto abaixo no seu atendimento.",
  discountBadge = "Condição Exclusiva",
  onOpenBooking,
}: PromotionalBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 text-white shadow-md">
      {/* Círculos Decorativos */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        
        {/* Conteúdo do Banner */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-100 backdrop-blur-xs">
            <Gift className="h-3.5 w-3.5" />
            <span>{discountBadge}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-amber-50/90 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Cupom & Botão de Agendamento */}
        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-white/20 p-1.5 backdrop-blur-md border border-white/30">
            <span className="px-3 py-1 font-mono text-xs sm:text-sm font-extrabold tracking-widest text-white">
              {couponCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCoupon}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-xs hover:bg-amber-50 transition"
              title="Copiar cupom"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenBooking}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-extrabold text-amber-900 shadow-md hover:bg-amber-50 active:scale-95 transition"
          >
            <span>Aproveitar Desconto</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
