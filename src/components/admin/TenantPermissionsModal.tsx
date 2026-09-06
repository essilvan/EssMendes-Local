"use client";

import React, { useState, useEffect } from "react";
import type { SuperAdminTenantItem, TenantPermissions } from "@/types";
import { DEFAULT_TENANT_PERMISSIONS } from "@/types";
import {
  Shield,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
  Sparkles,
  Scissors,
  Star,
  Settings,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

interface TenantPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: SuperAdminTenantItem | null;
  onSuccess?: (tenantId: string, updatedPermissions: TenantPermissions) => void;
}

export function TenantPermissionsModal({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}: TenantPermissionsModalProps) {
  const [permissions, setPermissions] = useState<TenantPermissions>(DEFAULT_TENANT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tenant) {
      setPermissions({
        showcase: tenant.permissions?.showcase !== false,
        services: tenant.permissions?.services !== false,
        before_after: tenant.permissions?.before_after !== false,
        reviews: tenant.permissions?.reviews !== false,
        settings: tenant.permissions?.settings !== false,
        billing: tenant.permissions?.billing !== false,
      });
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, tenant]);

  if (!isOpen || !tenant) return null;

  const togglePermission = (key: keyof TenantPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    setPermissions({
      showcase: true,
      services: true,
      before_after: true,
      reviews: true,
      settings: true,
      billing: true,
    });
  };

  const handleDeselectAll = () => {
    setPermissions({
      showcase: false,
      services: false,
      before_after: false,
      reviews: false,
      settings: false,
      billing: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/super-admin/tenants/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          permissions,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage("Permissões do estabelecimento atualizadas com sucesso!");
        onSuccess?.(tenant.id, permissions);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.error || "Erro ao salvar permissões.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha na comunicação com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const permissionItems: Array<{
    key: keyof TenantPermissions;
    title: string;
    description: string;
    icon: any;
    badgeColor: string;
  }> = [
    {
      key: "showcase",
      title: "Vitrine & Perfil (showcase)",
      description: "Edição da vitrine pública, bio, logo, fotos e catálogo de produtos",
      icon: ShoppingBag,
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      key: "services",
      title: "Serviços & Catálogo (services)",
      description: "Gerenciamento de tabela de serviços, preços e tempos de duração",
      icon: Scissors,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      key: "before_after",
      title: "Gerador Antes e Depois (before_after)",
      description: "Ferramenta visual de comparativo de fotos e portfólio de resultados",
      icon: Sparkles,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      key: "reviews",
      title: "Avaliações Google (reviews)",
      description: "Sincronização oficial do Google Places e respostas automáticas",
      icon: Star,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      key: "settings",
      title: "Configurações & Horários (settings)",
      description: "Horários de atendimento, WhatsApp comercial, cores e dados gerais",
      icon: Settings,
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      key: "billing",
      title: "Faturamento & Plano (billing)",
      description: "Acesso à tela de assinaturas, planos Pro e comprovantes de pagamento",
      icon: CreditCard,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-800">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Privilégios & Permissões de Menus
              </h3>
              <p className="text-xs text-slate-500">
                Controle quais áreas e menus o lojista poderá acessar no painel
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

        {/* Estabelecimento Alvo */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-teal-600" />
            <span className="font-bold text-slate-900">{tenant.name}</span>
          </div>
          <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
            {tenant.slug}
          </span>
        </div>

        {/* Barra de Ações Rápidas */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Recursos Disponíveis
          </span>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-teal-700 font-bold hover:underline cursor-pointer"
            >
              Marcar Todos
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-slate-500 font-medium hover:underline cursor-pointer"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        {/* Formulário com Lista de Switches/Checkboxes */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            {permissionItems.map((item) => {
              const Icon = item.icon;
              const isChecked = permissions[item.key];

              return (
                <label
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                    isChecked
                      ? "border-teal-300 bg-teal-50/30 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.badgeColor}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 leading-tight">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  {/* Switch Elegante */}
                  <div className="relative inline-flex items-center shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(item.key)}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                  </div>
                </label>
              );
            })}
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

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-800 disabled:opacity-50 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando Permissões...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Salvar Permissões</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
