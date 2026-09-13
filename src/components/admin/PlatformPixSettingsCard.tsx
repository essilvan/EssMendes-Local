"use client";

import React, { useState, useTransition } from "react";
import { updatePlatformPixSettingsAction } from "@/services/platform-settings.actions";
import type { PlatformPixSettings } from "@/types";
import {
  QrCode,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  KeyRound,
} from "lucide-react";

interface PlatformPixSettingsCardProps {
  initialSettings?: PlatformPixSettings;
}

export function PlatformPixSettingsCard({
  initialSettings,
}: PlatformPixSettingsCardProps) {
  const [pixKey, setPixKey] = useState(
    initialSettings?.pix_agency_key || "essilvanmendes@gmail.com"
  );
  const [pixHolder, setPixHolder] = useState(
    initialSettings?.pix_agency_holder || "EssMendes Tecnologia"
  );

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanKey = pixKey.trim();
    const cleanHolder = pixHolder.trim();

    if (!cleanKey) {
      setFeedback({ type: "error", message: "Informe a Chave Pix da agência." });
      return;
    }

    if (!cleanHolder) {
      setFeedback({ type: "error", message: "Informe o Titular da conta Pix." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await updatePlatformPixSettingsAction({
          pixAgencyKey: cleanKey,
          pixAgencyHolder: cleanHolder,
        });

        if (res.success) {
          setFeedback({
            type: "success",
            message: "Dados de cobrança Pix atualizados com sucesso e sincronizados na plataforma!",
          });
          setTimeout(() => setFeedback(null), 5000);
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Erro ao salvar dados Pix da agência.",
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err?.message || "Falha de conexão com o servidor ao salvar.",
        });
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shrink-0">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              ⚙️ Dados de Cobrança da Agência (Chave Pix Manual)
            </h2>
            <p className="text-xs text-slate-500">
              Esses dados são exibidos aos clientes lojistas para pagamento manual da taxa de setup ou transferências bancárias diretas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Proteção RLS Ativa (Service Role)</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Campo: Chave Pix da Agência */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-teal-600" />
              <span>Chave Pix da Agência *</span>
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              disabled={isPending}
              placeholder="Ex: financeiro@agencia.com ou CNPJ"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-2xs transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-60"
            />
            <span className="text-[11px] text-slate-400">
              Pode ser e-mail, telefone, CPF/CNPJ ou chave aleatória EVP.
            </span>
          </div>

          {/* Campo: Titular da Conta */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-teal-600" />
              <span>Titular da Conta *</span>
            </label>
            <input
              type="text"
              value={pixHolder}
              onChange={(e) => setPixHolder(e.target.value)}
              disabled={isPending}
              placeholder="Ex: EssMendes Tecnologia Ltda"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-2xs transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-60"
            />
            <span className="text-[11px] text-slate-400">
              Nome da empresa ou titular cadastrado no banco/PSP.
            </span>
          </div>
        </div>

        {/* Feedback de Status */}
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs animate-in fade-in ${
              feedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Botão de Gravação */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:scale-101 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-teal-200" />
                <span>Salvando Dados Pix...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar Dados Pix</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
