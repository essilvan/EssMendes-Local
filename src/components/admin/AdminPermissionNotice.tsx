"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

function PermissionNoticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const errorType = searchParams.get("error");
  const isPermissionError = errorType === "recurso_indisponivel";

  useEffect(() => {
    if (isPermissionError) {
      setVisible(true);
    }
  }, [isPermissionError]);

  if (!visible || !isPermissionError) return null;

  const handleDismiss = () => {
    setVisible(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const newQuery = params.toString();
    router.replace(`${pathname}${newQuery ? `?${newQuery}` : ""}`, { scroll: false });
  };

  return (
    <div
      role="alert"
      className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xs transition animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-950">
            Recurso não disponível para o seu plano
          </h4>
          <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
            O módulo que você tentou acessar não está habilitado para o seu estabelecimento.
            Entre em contato com o administrador caso deseje liberar o acesso.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-lg p-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
        title="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AdminPermissionNotice() {
  return (
    <Suspense fallback={null}>
      <PermissionNoticeContent />
    </Suspense>
  );
}
