"use client";

import React, { useState, useEffect } from "react";
import type { SuperAdminTenantItem } from "@/types";
import {
  updateTenantPricingAction,
  confirmTenantSetupPaymentAction,
} from "@/services/platform-settings.actions";
import {
  Wrench,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Check,
  Clock,
  Store,
  CreditCard,
  Sparkles,
  Calendar,
  Save,
} from "lucide-react";

interface TenantSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: SuperAdminTenantItem | null;
  onSuccess?: (
    tenantId: string,
    updatedSetupFee: number,
    updatedMonthlyFee: number,
    isPaid: boolean,
    expiresAt?: string
  ) => void;
}

export function TenantSetupModal({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}: TenantSetupModalProps) {
  const [setupFee, setSetupFee] = useState<number>(197);
  const [monthlyFee, setMonthlyFee] = useState<number>(97);
  const [firstBillingDays, setFirstBillingDays] = useState<number>(30);

  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tenant) {
      setSetupFee(
        tenant.setup_fee_amount !== null && tenant.setup_fee_amount !== undefined
          ? Number(tenant.setup_fee_amount)
          : 197
      );
      setMonthlyFee(
        tenant.monthly_fee_amount !== null && tenant.monthly_fee_amount !== undefined
          ? Number(tenant.monthly_fee_amount)
          : 97
      );
      setFirstBillingDays(30);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, tenant]);

  if (!isOpen || !tenant) return null;

  const isAlreadyPaid = Boolean(tenant.setup_fee_paid);

  // Ação 1: Confirmar Pagamento de Setup (Pix Manual)
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const numSetup = Number(setupFee);
    const numMonthly = Number(monthlyFee);

    if (isNaN(numSetup) || numSetup < 0) {
      setErrorMessage("Por favor, insira um valor válido para a Taxa de Setup.");
      return;
    }

    if (isNaN(numMonthly) || numMonthly < 0) {
      setErrorMessage("Por favor, insira um valor válido para a Mensalidade Recorrente.");
      return;
    }

    setIsLoadingConfirm(true);
    try {
      const res = await confirmTenantSetupPaymentAction({
        tenantId: tenant.id,
        setupFeeAmount: numSetup,
        monthlyFeeAmount: numMonthly,
        firstBillingDays,
      });

      if (res.success && res.data) {
        setSuccessMessage(
          `Pagamento de Setup (R$ ${numSetup.toFixed(2).replace(".", ",")}) confirmado com sucesso! Mensalidade de R$ ${numMonthly.toFixed(2).replace(".", ",")}/mês agendada para ${firstBillingDays} dias.`
        );
        onSuccess?.(
          tenant.id,
          numSetup,
          numMonthly,
          true,
          res.data.subscriptionExpiresAt
        );
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || "Erro ao confirmar pagamento de setup.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha de conexão com o servidor.");
    } finally {
      setIsLoadingConfirm(false);
    }
  };

  // Ação 2: Salvar Apenas Valores Customizados (Taxa de Setup e Mensalidade)
  const handleSavePricingOnly = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const numSetup = Number(setupFee);
    const numMonthly = Number(monthlyFee);

    if (isNaN(numSetup) || numSetup < 0) {
      setErrorMessage("Por favor, insira um valor válido para a Taxa de Setup.");
      return;
    }

    if (isNaN(numMonthly) || numMonthly < 0) {
      setErrorMessage("Por favor, insira um valor válido para a Mensalidade Recorrente.");
      return;
    }

    setIsLoadingPricing(true);
    try {
      const res = await updateTenantPricingAction({
        tenantId: tenant.id,
        setupFeeAmount: numSetup,
        monthlyFeeAmount: numMonthly,
      });

      if (res.success) {
        setSuccessMessage(
          `Valores atualizados: Setup R$ ${numSetup.toFixed(2).replace(".", ",")} e Mensalidade R$ ${numMonthly.toFixed(2).replace(".", ",")}/mês!`
        );
        onSuccess?.(tenant.id, numSetup, numMonthly, isAlreadyPaid);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.error || "Erro ao salvar valores de precificação.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha na requisição ao servidor.");
    } finally {
      setIsLoadingPricing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Precificação & Setup do Cliente
              </h3>
              <p className="text-xs text-slate-500">
                Configure valores customizados e confirme pagamentos Pix manuais
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo do Estabelecimento */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Empresa:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-teal-600" />
              {tenant.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Status do Setup:</span>
            {isAlreadyPaid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <Check className="h-3 w-3 text-emerald-600" />
                Setup Quitado (R$ {Number(tenant.setup_fee_amount || 197).toFixed(2).replace(".", ",")})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                <Clock className="h-3 w-3 text-amber-700" />
                Setup Pendente (R$ {Number(tenant.setup_fee_amount || 197).toFixed(2).replace(".", ",")})
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Mensalidade Atual:</span>
            <span className="font-bold text-slate-800">
              R$ {Number(tenant.monthly_fee_amount || 97).toFixed(2).replace(".", ",")}/mês
            </span>
          </div>

          {tenant.setup_paid_at && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5 mt-1">
              <span>Data de Quitação do Setup:</span>
              <span className="font-medium text-slate-700">
                {new Date(tenant.setup_paid_at).toLocaleDateString("pt-BR")} às{" "}
                {new Date(tenant.setup_paid_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {tenant.subscription_expires_at && (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Vencimento da Mensalidade:</span>
              <span className="font-bold text-teal-700">
                {new Date(tenant.subscription_expires_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
        </div>

        {/* Formulário de Configuração */}
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Taxa de Setup (R$) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Taxa de Setup (R$) *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="text-xs font-bold">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={setupFee}
                  onChange={(e) => setSetupFee(Number(e.target.value))}
                  disabled={isLoadingConfirm || isLoadingPricing}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Ex: 197,00 (padrão) ou negociado
              </p>
            </div>

            {/* 2. Mensalidade Recorrente (R$) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mensalidade Recorrente (R$) *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="text-xs font-bold">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  disabled={isLoadingConfirm || isLoadingPricing}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Ex: 97,00 (padrão) ou customizado
              </p>
            </div>
          </div>

          {/* Prazo para Primeira Mensalidade (caso confirme setup) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              <span>Vencimento da 1ª Mensalidade (após confirmação):</span>
            </label>
            <div className="relative">
              <select
                value={firstBillingDays}
                onChange={(e) => setFirstBillingDays(Number(e.target.value))}
                disabled={isLoadingConfirm || isLoadingPricing}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
              >
                <option value={30}>30 dias [Padrão - Vigência de 1 mês]</option>
                <option value={45}>45 dias [Carência especial de 15 dias]</option>
                <option value={60}>60 dias [Carência especial de 2 meses]</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              Ao confirmar o setup, a vitrine é desbloqueada e a data de vencimento da mensalidade recorrente é agendada para 30 dias à frente.
            </p>
          </div>

          {/* Feedback */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {/* Botão 1: Confirmar Pagamento de Setup (Pix Manual) */}
            <button
              type="submit"
              disabled={isLoadingConfirm || isLoadingPricing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer hover:scale-101"
            >
              {isLoadingConfirm ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-100" />
                  <span>Confirmando Pagamento e Liberando Vitrine...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Confirmar Pagamento de Setup (Pix Manual)</span>
                </>
              )}
            </button>

            {/* Botão 2: Salvar Apenas Valores Customizados de Setup e Mensalidade */}
            <button
              type="button"
              onClick={handleSavePricingOnly}
              disabled={isLoadingConfirm || isLoadingPricing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoadingPricing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                  <span>Salvando Precificação...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 text-slate-500" />
                  <span>Salvar Valores de Precificação (Sem marcar como pago)</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Controle de Setup & Mensalidade EssMendes</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
