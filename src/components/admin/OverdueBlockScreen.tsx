"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
  LogOut,
  Wrench,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { MercadoPagoSubscribeButton } from "./MercadoPagoSubscribeButton";
import { logoutAction } from "@/services/auth.actions";
import Link from "next/link";

interface OverdueBlockScreenProps {
  tenant: {
    id: string;
    name: string;
    slug?: string;
    setup_fee_paid?: boolean | null;
    setup_fee_amount?: number | null;
  };
  userEmail?: string;
}

export function OverdueBlockScreen({
  tenant,
  userEmail = "",
}: OverdueBlockScreenProps) {
  const [isCopiedPix, setIsCopiedPix] = useState(false);

  const isSetupPending = tenant.setup_fee_paid === false;
  const setupAmount =
    tenant.setup_fee_amount !== null && tenant.setup_fee_amount !== undefined
      ? Number(tenant.setup_fee_amount)
      : 197;

  const agencyPixKey =
    process.env.NEXT_PUBLIC_AGENCY_PIX_KEY || "essilvanmendes@gmail.com";
  const agencyPhone =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ||
    process.env.NEXT_PUBLIC_AGENCY_WHATSAPP ||
    "5511999999999";

  const handleCopyPix = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(agencyPixKey);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = agencyPixKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsCopiedPix(true);
      setTimeout(() => setIsCopiedPix(false), 2500);
    } catch (err) {
      console.error("Erro ao copiar Pix:", err);
    }
  };

  const whatsappMessage = `Olá! Segue o comprovante do pagamento da taxa de setup da vitrine ${tenant.name} (R$ ${setupAmount.toFixed(2).replace(".", ",")}). Aguardo a liberação.`;
  const cleanPhone = agencyPhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  // CASO 1: SETUP PENDENTE (Tela contextual de implantação com Pix Manual e WhatsApp)
  if (isSetupPending) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-6 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in">
          {/* Ícone de Implantação */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-8 ring-amber-50">
            <Wrench className="h-9 w-9" />
          </div>

          {/* Título & Descrição Contextual */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-600/20">
              <span>Implantação e Otimização em Andamento</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Estamos finalizando a implantação da sua vitrine
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Estamos configurando seu domínio, sincronização com o Google Maps e catálogo inicial.
              Envie o comprovante da taxa de setup para nosso time de suporte para liberação imediata.
            </p>
          </div>

          {/* Dados do Pix Manual */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <span className="text-xs font-semibold text-slate-700">Taxa de Implantação & Setup:</span>
              <span className="text-xl font-black text-amber-950">
                R$ {setupAmount.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Chave Pix Comercial (E-mail):
              </span>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                <span className="font-mono text-xs font-bold text-slate-800 select-all truncate">
                  {agencyPixKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 transition px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 cursor-pointer shrink-0"
                >
                  {isCopiedPix ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Após realizar a transferência Pix, clique no botão abaixo para enviar o comprovante ao nosso WhatsApp oficial.
            </p>
          </div>

          {/* Botão de Enviar Comprovante no WhatsApp */}
          <div className="space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:scale-101"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Enviar Comprovante no WhatsApp</span>
            </a>
          </div>

          {/* Rodapé */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link
              href="/admin/assinatura"
              className="text-teal-700 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Ver detalhes de planos e assinatura</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition font-medium cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sair da conta</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // CASO 2: SETUP JÁ PAGO E MENSALIDADE EM ATRASO (Fluxo nativo com QR Code Mercado Pago)
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-6 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in">
        {/* Ícone de Atenção */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-8 ring-red-50">
          <ShieldAlert className="h-9 w-9" />
        </div>

        {/* Mensagem Principal */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-600/20">
            <Lock className="h-3.5 w-3.5" />
            <span>Acesso Administrativo Temporariamente Bloqueado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Assinatura em Atraso
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Identificamos uma pendência financeira na assinatura mensal do estabelecimento{" "}
            <strong className="text-slate-900">{tenant.name}</strong>. Para sua segurança e continuidade dos serviços, o acesso ao painel foi suspenso temporariamente.
          </p>
        </div>

        {/* Caixa de Ação Imediata */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <span className="text-xs font-semibold text-slate-600">Mensalidade em aberto:</span>
            <span className="text-lg font-black text-slate-900">R$ 97,00</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Método de liberação:</span>
            <span className="font-bold text-emerald-700">Liberação imediata via Pix</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ao efetuar o pagamento, a aprovação do Mercado Pago desbloqueia automaticamente todos os recursos de sua conta por mais 30 dias.
          </p>
        </div>

        {/* Botão de Pagamento Mercado Pago para Mensalidade Regular */}
        <div>
          <MercadoPagoSubscribeButton
            tenantId={tenant.id}
            tenantName={tenant.name}
            userEmail={userEmail}
            payerName={tenant.name}
            offerType="monthly_renewal"
            label="Regularizar e Pagar Agora (R$ 97,00) via Pix ou Cartão"
          />
        </div>

        {/* Rodapé com Links Úteis */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <Link
            href="/admin/assinatura"
            className="text-teal-700 font-semibold hover:underline"
          >
            Ver detalhes da assinatura
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition font-medium cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair da conta</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
