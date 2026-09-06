"use client";

import React, { useState, useEffect } from "react";
import type { SuperAdminTenantItem } from "@/types";
import {
  Key,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Eye,
  EyeOff,
  Store,
  ExternalLink,
} from "lucide-react";

interface TenantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: SuperAdminTenantItem | null;
  onSuccess?: (tenantId: string, updatedEmail: string) => void;
}

function generateRandomPassword(length = 8): string {
  // Caracteres legíveis e fáceis de digitar (sem caracteres ambíguos como l, 1, O, 0)
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function TenantAccessModal({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}: TenantAccessModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && tenant) {
      setEmail(tenant.contact_email || "");
      setPassword(generateRandomPassword(8));
      setShowPassword(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsCopied(false);
    }
  }, [isOpen, tenant]);

  if (!isOpen || !tenant) return null;

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(8));
    setIsCopied(false);
  };

  const getWhatsAppMessage = () => {
    return `Olá! Segue seu acesso à plataforma EssMendes:\nLink: https://essmendes.com.br/login\nLogin: ${email}\nSenha: ${password}`;
  };

  const handleCopyWhatsApp = async () => {
    const text = getWhatsAppMessage();
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error("Erro ao copiar para clipboard:", err);
    }
  };

  const cleanPhone = tenant.phone ? tenant.phone.replace(/\D/g, "") : "";
  const whatsAppLink =
    cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}?text=${encodeURIComponent(
          getWhatsAppMessage()
        )}`
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Informe um e-mail válido para o lojista.");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/super-admin/tenants/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(
          data.message || "Acesso ativado com sucesso! As credenciais já estão prontas para envio."
        );
        onSuccess?.(tenant.id, cleanEmail);
      } else {
        setErrorMessage(data.error || "Erro ao gerar credenciais de acesso.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha na conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header Compacto */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gerenciar Acesso do Lojista
              </h3>
              <p className="text-xs text-slate-500">
                Gere e envie as credenciais de login para o proprietário
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informações do Estabelecimento */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Estabelecimento:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-teal-600" />
              {tenant.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Slug da Vitrine:</span>
            <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {tenant.slug}
            </span>
          </div>
        </div>

        {/* Formulário de Acesso */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* E-mail de Login */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              E-mail de Login *
            </label>
            <input
              type="email"
              placeholder="ex: contato@lojista.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            <span className="text-[10px] text-slate-400">
              O lojista usará este e-mail para fazer login em essmendes.com.br/login
            </span>
          </div>

          {/* Senha Provisória */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Senha Provisória *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Gerar Senha Aleatória (8 dígitos)</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400">
              Mínimo de 6 dígitos. A senha é gerada automaticamente para facilitar o envio rápido.
            </span>
          </div>

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

          {/* Botão de Ação: Salvar e Ativar Acesso */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-800 disabled:opacity-50 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando e Ativando Acesso...</span>
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                <span>Salvar e Ativar Acesso</span>
              </>
            )}
          </button>
        </form>

        {/* Seção WhatsApp: Copiar Dados Prontos */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              Dados de Acesso para Enviar no WhatsApp
            </span>
          </div>

          <pre className="rounded-lg bg-white p-3 font-mono text-[11px] text-slate-800 border border-emerald-100 whitespace-pre-wrap leading-relaxed">
            {getWhatsAppMessage()}
          </pre>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 font-bold text-xs transition shadow-2xs cursor-pointer ${
                isCopied
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white"
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copiado para a Área de Transferência! ✅</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Dados de Acesso para Enviar no WhatsApp</span>
                </>
              )}
            </button>

            {whatsAppLink && (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                title="Abrir diretamente conversa no WhatsApp"
              >
                <span>Enviar no WhatsApp</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
