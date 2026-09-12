"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  Trash2,
  Crown,
  KeyRound,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

export interface SuperAdminItem {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string | null;
  isCurrentAdmin: boolean;
  isMasterOwner: boolean;
}

interface SuperAdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  currentUserId?: string;
}

function generateRandomPassword(length = 8): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function SuperAdminUsersModal({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserId,
}: SuperAdminUsersModalProps) {
  const [activeTab, setActiveTab] = useState<"novo" | "listar">("novo");

  // Campos do formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);

  // Estados de loading e feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Dados salvos do último admin criado para exibição do card de compartilhamento
  const [lastCreated, setLastCreated] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  // Lista de administradores
  const [admins, setAdmins] = useState<SuperAdminItem[]>([]);

  // Buscar lista de administradores
  const fetchAdmins = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/super-admin/admins");
      const data = await res.json();
      if (data.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
    } catch (err: any) {
      console.error("[SuperAdminUsersModal] Erro ao carregar administradores:", err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Ao abrir o modal, reseta formulário e carrega lista
  useEffect(() => {
    if (isOpen) {
      setPassword(generateRandomPassword(8));
      setShowPassword(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsCopied(false);
      setLastCreated(null);
      fetchAdmins();
    }
  }, [isOpen, fetchAdmins]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(8));
    setIsCopied(false);
  };

  const getOriginUrl = () => {
    if (typeof window !== "undefined" && window.location.origin) {
      return `${window.location.origin}/super-admin`;
    }
    return "https://app.essmendes.com.br/super-admin";
  };

  const getWhatsAppMessage = (adminData?: {
    name: string;
    email: string;
    password: string;
  }) => {
    const targetName = adminData?.name || name || "Administrador";
    const targetEmail = adminData?.email || email;
    const targetPass = adminData?.password || password;
    const panelUrl = getOriginUrl();

    return `🔐 *ACESSO DE SUPER ADMINISTRADOR — ESSMENDES LOCAL*

Olá, *${targetName}*!
Você recebeu acesso de Super Administrador ao painel master da EssMendes Local.

🔗 *Link do Painel:* ${panelUrl}
✉️ *E-mail de Login:* ${targetEmail}
🔑 *Senha Provisória:* ${targetPass}

⚠️ _Por segurança, recomendamos que acerte sua senha no primeiro acesso._`;
  };

  const handleCopyAccess = async (adminData?: {
    name: string;
    email: string;
    password: string;
  }) => {
    const text = getWhatsAppMessage(adminData);
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error("Erro ao copiar dados de acesso:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCopied(false);

    if (!email || !email.includes("@")) {
      setErrorMessage("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("A senha provisória deve conter no mínimo 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const createdInfo = {
          name: name.trim() || email.split("@")[0],
          email: email.trim().toLowerCase(),
          password: password.trim(),
        };
        setLastCreated(createdInfo);
        setSuccessMessage(
          data.message || "Super Administrador configurado com sucesso!"
        );
        setName("");
        setEmail("");
        setPassword(generateRandomPassword(8));
        // Atualiza a lista em segundo plano
        fetchAdmins();
      } else {
        setErrorMessage(data.error || "Erro ao conceder privilégio de Super Admin.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha na comunicação com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (admin: SuperAdminItem) => {
    if (admin.isMasterOwner) {
      alert("O Administrador Master Principal não pode ser revogado.");
      return;
    }

    if (
      admin.isCurrentAdmin ||
      admin.id === currentUserId ||
      admin.email.toLowerCase() === currentUserEmail?.toLowerCase()
    ) {
      alert("Você não pode revogar seu próprio acesso de Super Administrador.");
      return;
    }

    const confirmMsg = `Tem certeza que deseja revogar o privilégio de Super Admin de "${admin.name}" (${admin.email})?`;
    if (!window.confirm(confirmMsg)) return;

    setRevokingId(admin.id);
    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: admin.id }),
      });

      const data = await res.json();
      if (data.success) {
        setAdmins((prev) => prev.filter((item) => item.id !== admin.id));
        setSuccessMessage(data.message || "Privilégio revogado com sucesso.");
      } else {
        alert(data.error || "Erro ao revogar privilégio.");
      }
    } catch (err: any) {
      alert(err?.message || "Falha na conexão ao revogar acesso.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Gerenciar Super Administradores
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre ou promova administradores com acesso total à plataforma
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

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("novo")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "novo"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>🛡️ Conceder Novo Acesso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("listar");
              fetchAdmins();
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "listar"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>
              Listagem de Administradores ({admins.length})
            </span>
          </button>

          <div className="ml-auto">
            <button
              type="button"
              onClick={fetchAdmins}
              disabled={isLoadingList}
              title="Atualizar lista"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingList ? "animate-spin text-indigo-600" : ""}`}
              />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          </div>
        </div>

        {/* Notificações de Erro e Sucesso */}
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

        {/* Conteúdo Aba 1: Conceder Novo Super Admin */}
        {activeTab === "novo" && (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nome do Administrador
                </label>
                <input
                  type="text"
                  placeholder="ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  placeholder="ex: joao@essmendes.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <span className="text-[11px] text-slate-400">
                  Se o e-mail já estiver cadastrado no sistema, a conta existente será promovida a Super Administrador.
                </span>
              </div>

              {/* Senha Provisória */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Senha de Acesso Provisória *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Gerar Senha Segura (8 caracteres)</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Concedendo Acesso de Super Admin...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Conceder Acesso de Super Admin</span>
                  </>
                )}
              </button>
            </form>

            {/* Feedback com Card para Copiar Acesso */}
            {lastCreated && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Acesso Gerado com Sucesso!
                  </span>
                  <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    /super-admin
                  </span>
                </div>

                <p className="text-slate-600 text-[11px]">
                  Envie as credenciais abaixo para o novo administrador via WhatsApp ou E-mail:
                </p>

                <pre className="rounded-lg bg-white p-3 font-mono text-[11px] text-slate-800 border border-emerald-100 whitespace-pre-wrap leading-relaxed">
                  {getWhatsAppMessage(lastCreated)}
                </pre>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyAccess(lastCreated)}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold text-xs transition shadow-xs cursor-pointer ${
                      isCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Acesso Copiado para Área de Transferência! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copiar Acesso (WhatsApp / E-mail)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo Aba 2: Listagem de Administradores */}
        {activeTab === "listar" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Usuários ativos com permissão total</span>
              <span>{admins.length} administrador(es)</span>
            </div>

            {isLoadingList && admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs">Carregando administradores...</span>
              </div>
            ) : admins.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                Nenhum administrador encontrado.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                {admins.map((admin) => {
                  const isSelf =
                    admin.isCurrentAdmin ||
                    admin.id === currentUserId ||
                    admin.email.toLowerCase() === currentUserEmail?.toLowerCase();

                  return (
                    <div
                      key={admin.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-slate-50/70 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {admin.name}
                          </span>

                          {admin.isMasterOwner && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              <Crown className="h-3 w-3 text-amber-600" />
                              Master Owner
                            </span>
                          )}

                          {isSelf && (
                            <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                              Você
                            </span>
                          )}

                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                            Super Admin
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span className="font-mono text-slate-700">{admin.email}</span>
                          {admin.created_at && (
                            <span className="text-slate-400">
                              Cadastrado em{" "}
                              {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 shrink-0">
                        {admin.isMasterOwner ? (
                          <span className="text-[11px] italic text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                            Imutável
                          </span>
                        ) : isSelf ? (
                          <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Sua Sessão Ativa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevoke(admin)}
                            disabled={revokingId === admin.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          >
                            {revokingId === admin.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Revogando...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Revogar Acesso</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rodapé informativo */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>EssMendes Local Master Security</span>
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
