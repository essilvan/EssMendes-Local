"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { MercadoPagoSubscribeButton } from "@/components/admin/MercadoPagoSubscribeButton";
import { cn } from "@/utils/cn";

interface Etapa2SubscriptionSectionProps {
  tenantId: string;
  tenantName: string;
  userEmail?: string;
  payerName?: string;
  payerCpf?: string;
  monthlyFeeAmount: number;
  isActive: boolean;
  isOverdue: boolean;
  isTrialOrPending: boolean;
  formattedPeriodEnd: string | null;
  daysRemaining: number | null;
}

export function Etapa2SubscriptionSection({
  tenantId,
  tenantName,
  userEmail = "",
  payerName = "",
  payerCpf = "",
  monthlyFeeAmount,
  isActive,
  isOverdue,
  isTrialOrPending,
  formattedPeriodEnd,
  daysRemaining,
}: Etapa2SubscriptionSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const monthlyAmount = monthlyFeeAmount || 97;
  const yearlyAmount = monthlyAmount * 10;
  const savingsAmount = monthlyAmount * 2;
  const monthlyEquivalent = yearlyAmount / 12;

  const isYearly = billingCycle === "yearly";
  const currentAmount = isYearly ? yearlyAmount : monthlyAmount;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Zap className="h-4 w-4 text-teal-600" />
        <span>Etapa 2: Mensalidade, Hospedagem & Manutenção Contínua</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Cabeçalho da Etapa 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {isYearly ? "Plano Anual da Vitrine EssMendes" : "Mensalidade Regular da Vitrine EssMendes"}
              </h2>

              {isActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Plano Ativo
                </span>
              )}

              {isOverdue && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Mensalidade em Atraso
                </span>
              )}

              {isTrialOrPending && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Aguardando Vencimento / Pagamento
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Hospedagem de alta velocidade, sincronização do Google Places, catálogo de produtos e posts de SEO Local contínuos.
            </p>
          </div>

          {/* Próxima Fatura */}
          <div className="flex flex-col sm:items-end bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">Data da Próxima Fatura</span>
            {formattedPeriodEnd ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">
                  {formattedPeriodEnd}
                </span>
                {daysRemaining !== null && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      daysRemaining > 5
                        ? "bg-emerald-100 text-emerald-800"
                        : daysRemaining >= 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {daysRemaining > 0
                      ? `${daysRemaining} dias restantes`
                      : daysRemaining === 0
                      ? "Vence hoje"
                      : "Expirado"}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm font-bold text-amber-700 mt-0.5">
                Agendada para 30 dias após confirmação do setup
              </span>
            )}
          </div>
        </div>

        {/* 1. Componente Visual de Seleção (Toggle Mensal / Anual) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selecione o Ciclo de Cobrança:
            </span>
            <span className="text-[11px] text-teal-700 font-medium">
              Troque a qualquer momento
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
            {/* Botão 1: Mensal */}
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <span>Mensal (R$ {monthlyAmount.toFixed(2).replace(".", ",")}/mês)</span>
            </button>

            {/* Botão 2: Anual com Desconto */}
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative",
                billingCycle === "yearly"
                  ? "bg-white text-teal-950 shadow-sm ring-2 ring-teal-600/30"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <span>Anual (Economize 2 meses)</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300 shrink-0">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Recomendado • -17% OFF
              </span>
            </button>
          </div>
        </div>

        {/* 2. Destaque do Valor Recorrente Atualizado Dinamicamente */}
        <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isYearly ? "Valor do Plano Anual (12 Meses)" : "Valor Recorrente Acordado"}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                R$ {currentAmount.toFixed(2).replace(".", ",")}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {isYearly ? "/ ano à vista" : "/ mês"}
              </span>
              {isYearly && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  equivale a ~R$ {monthlyEquivalent.toFixed(2).replace(".", ",")}/mês
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 max-w-sm leading-relaxed">
            {isYearly ? (
              <span>
                Acesso e hospedagem garantidos por <strong>12 meses completos</strong> (Economia real de{" "}
                <strong className="text-emerald-700">R$ {savingsAmount.toFixed(2).replace(".", ",")}</strong>).
              </span>
            ) : (
              <span>
                Cobrança mensal de hospedagem, domínio, suporte e manutenção contínua.
              </span>
            )}
          </div>
        </div>

        {/* 3. Botão Mercado Pago Exclusivo para o Ciclo Selecionado */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <MercadoPagoSubscribeButton
            tenantId={tenantId}
            tenantName={tenantName}
            userEmail={userEmail}
            payerName={payerName}
            payerCpf={payerCpf}
            offerType={isYearly ? "yearly" : "monthly_renewal"}
            type={isYearly ? "yearly" : "monthly_renewal"}
            period={billingCycle}
            amount={currentAmount}
            customAmount={currentAmount}
            description={
              isYearly
                ? `Plano Anual Vitrine EssMendes - ${tenantName}`
                : `Mensalidade Vitrine EssMendes - ${tenantName}`
            }
            pixButtonText={
              isYearly
                ? `⚡ Pagar Plano Anual via Pix Instantâneo (R$ ${yearlyAmount.toFixed(2).replace(".", ",")})`
                : `⚡ Pagar Mensalidade via Pix Instantâneo (R$ ${monthlyAmount.toFixed(2).replace(".", ",")})`
            }
            cardButtonText={
              isYearly
                ? `💳 Pagar Plano Anual no Cartão (em até 12x de R$ ${monthlyAmount.toFixed(2).replace(".", ",")})`
                : `💳 Pagar Mensalidade no Cartão de Crédito (R$ ${monthlyAmount.toFixed(2).replace(".", ",")})`
            }
          />
        </div>
      </div>
    </div>
  );
}
