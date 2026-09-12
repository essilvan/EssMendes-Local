"use client";

import React, { useState, useEffect } from "react";
import type { SuperAdminTenantItem } from "@/types";
import {
  confirmManualSetupPaymentAction,
  updateTenantSetupAmountAction,
} from "@/services/tenant-setup.actions";
import {
  Wrench,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Check,
  Clock,
  Store,
  CreditCard,
  Sparkles,
} from "lucide-react";

interface TenantSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: SuperAdminTenantItem | null;
  onSuccess?: (
    tenantId: string,
    updatedAmount: number,
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
  const [amount, setAmount] = useState<number>(197);
  const [firstBillingDays, setFirstBillingDays] = useState<number>(30);

  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  const [isLoadingUpdateOnly, setIsLoadingUpdateOnly] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tenant) {
      setAmount(
        tenant.setup_fee_amount !== null && tenant.setup_fee_amount !== undefined
          ? Number(tenant.setup_fee_amount)
          : 197
      );
      setFirstBillingDays(30);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, tenant]);

  if (!isOpen || !tenant) return null;

  const isAlreadyPaid = Boolean(tenant.setup_fee_paid);

  // Ação 1: Confirmar Recebimento (Pix Manual)
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setErrorMessage("Por favor, insira um valor válido para o setup.");
      return;
    }

    setIsLoadingConfirm(true);
    try {
      const res = await confirmManualSetupPaymentAction({
        tenantId: tenant.id,
        amount: numericAmount,
        firstBillingDays,
      });

      if (res.success && res.data) {
        setSuccessMessage(
          `Pagamento de R$ ${numericAmount.toFixed(2).replace(".", ",")} confirmado com sucesso! Primeira mensalidade agendada para ${firstBillingDays} dias.`
        );
        onSuccess?.(tenant.id, numericAmount, true, res.data.subscriptionExpiresAt);
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

  // Ação 2: Salvar Apenas Novo Valor Negociado (sem marcar como pago)
  const handleUpdateAmountOnly = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setErrorMessage("Por favor, insira um valor válido para o setup.");
      return;
    }

    setIsLoadingUpdateOnly(true);
    try {
      const res = await updateTenantSetupAmountAction({
        tenantId: tenant.id,
        amount: numericAmount,
      });

      if (res.success) {
        setSuccessMessage(
          `Valor negociado atualizado para R$ ${numericAmount.toFixed(2).replace(".", ",")} com sucesso!`
        );
        onSuccess?.(tenant.id, numericAmount, isAlreadyPaid);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.error || "Erro ao atualizar valor negociado.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha na requisição.");
    } finally {
      setIsLoadingUpdateOnly(false);
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
                Gerenciar Setup & Implantação
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste o valor customizado e confirme o pagamento Pix manual
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
            <span className="font-semibold text-slate-500">Status Atual do Setup:</span>
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

          {tenant.setup_paid_at && (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Data do Pagamento:</span>
              <span className="font-medium text-slate-700">
                {new Date(tenant.setup_paid_at).toLocaleDateString("pt-BR")} às{" "}
                {new Date(tenant.setup_paid_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Formulário de Configuração */}
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          {/* Valor do Setup */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Valor do Setup (R$) *
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="text-xs font-bold">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                disabled={isLoadingConfirm || isLoadingUpdateOnly}
                required
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 placeholder-slate-400 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Defina o valor negociado com o cliente (ex: R$ 197, R$ 297 ou customizado).
            </p>
          </div>

          {/* Seletor do Prazo para Primeira Mensalidade */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Primeira Mensalidade em:
            </label>
            <div className="relative">
              <select
                value={firstBillingDays}
                onChange={(e) => setFirstBillingDays(Number(e.target.value))}
                disabled={isLoadingConfirm || isLoadingUpdateOnly}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
              >
                <option value={30}>30 dias [Padrão - Vigência de 1 mês]</option>
                <option value={45}>45 dias [Carência especial de 15 dias]</option>
                <option value={60}>60 dias [Carência especial de 2 meses]</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              Data de vencimento da mensalidade regular recorrente (R$ 97/mês) calculada automaticamente.
            </p>
          </div>

          {/* Alertas */}
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
          <div className="space-y-2 pt-2">
            {/* Botão Principal: Confirmar Recebimento (Pix Manual) */}
            <button
              type="submit"
              disabled={isLoadingConfirm || isLoadingUpdateOnly}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isLoadingConfirm ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirmando Recebimento e Ativando...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Confirmar Recebimento (Pix Manual)</span>
                </>
              )}
            </button>

            {/* Botão Secundário: Atualizar Apenas o Valor Negociado */}
            {!isAlreadyPaid && (
              <button
                type="button"
                onClick={handleUpdateAmountOnly}
                disabled={isLoadingConfirm || isLoadingUpdateOnly}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoadingUpdateOnly ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                    <span>Salvando valor...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                    <span>Salvar Apenas Novo Valor Negociado (R$ {Number(amount || 0).toFixed(2).replace(".", ",")})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Controle de Setup EssMendes</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
