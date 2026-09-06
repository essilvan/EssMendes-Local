"use client";

import React, { useState } from "react";
import type { SuperAdminTenantItem } from "@/types";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface TenantDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: SuperAdminTenantItem | null;
  onConfirmDelete: (tenantId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function TenantDeleteModal({
  isOpen,
  onClose,
  tenant,
  onConfirmDelete,
  isDeleting = false,
}: TenantDeleteModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !tenant) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirmDelete(tenant.id);
    } catch (err: any) {
      setError(err?.message || "Erro ao excluir estabelecimento.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 border border-rose-100">
        {/* Header com ícone de alerta crítico */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 border border-rose-200 text-rose-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Excluir Estabelecimento
              </h3>
              <p className="text-xs text-rose-600 font-semibold">
                Ação Crítica e Irreversível
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensagem de Confirmação Crítica */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2 text-xs text-rose-950">
          <p className="font-semibold text-sm leading-snug">
            Tem certeza que deseja apagar o estabelecimento{" "}
            <span className="font-bold underline text-rose-900">&quot;{tenant.name}&quot;</span>?
          </p>
          <p className="text-rose-800 leading-relaxed">
            Esta ação removerá todos os serviços, fotos de antes e depois e configurações da vitrine permanentemente.
          </p>
          <div className="pt-1 font-mono text-[11px] text-rose-700">
            Slug: <strong>{tenant.slug}</strong>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-100 p-3 text-xs text-red-900 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 transition cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Confirmar Exclusão</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
