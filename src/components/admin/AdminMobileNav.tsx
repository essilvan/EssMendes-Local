"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/services/auth.actions";
import {
  Menu,
  X,
  Sparkles,
  Globe,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { getTenantPublicUrl, getTenantDisplayDomain } from "@/utils/tenant-url";
import type { TenantPermissions } from "@/types";
import {
  getFilteredNavItems,
  isNavItemActive,
  type AdminNavItem,
} from "./admin-navigation";

interface AdminMobileNavProps {
  companyName: string;
  companySlug: string;
  userEmail: string;
  fullName: string;
  isSuperAdmin?: boolean;
  permissions?: TenantPermissions | null;
}

export function AdminMobileNav({
  companyName,
  companySlug,
  userEmail,
  fullName,
  isSuperAdmin = false,
  permissions,
}: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  // Fecha o drawer automaticamente ao mudar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Bloqueia scroll do body e fecha com tecla Escape quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getTenantPublicUrl(companySlug);
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
    }
  };

  const navItems: AdminNavItem[] = getFilteredNavItems(permissions, isSuperAdmin);

  return (
    <>
      {/* Topbar Mobile Clean (Apenas Logo/Badge, Nome e Hambúrguer) */}
      <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 font-bold text-white text-xs shadow-xs">
            EM
          </div>
          <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">
            {companyName}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 cursor-pointer"
          aria-label="Abrir menu de navegação"
          aria-expanded={isOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer Mobile (Gaveta Lateral) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop Escurecido */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Painel da Gaveta */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navegação Administrativa"
            className="relative z-50 flex h-full w-full max-w-xs flex-col justify-between bg-white p-4 shadow-2xl animate-in slide-in-from-right duration-250 ease-out"
          >
            {/* Topo da Gaveta: Logo, Nome da Loja e Botão Fechar */}
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 font-bold text-white text-xs shadow-xs">
                    EM
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-slate-900 leading-tight">
                      {companyName}
                    </h2>
                    <span className="text-[10px] font-medium text-teal-700 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      EssMendes Local
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition focus:outline-none cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Super Admin Back Shortcut */}
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Painel Super Admin</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-amber-700 shrink-0" />
                </Link>
              )}

              {/* Link de Vitrine Pública com botão Copiar */}
              <div className="flex items-center gap-1 rounded-lg border border-teal-100 bg-teal-50/60 p-1 transition hover:border-teal-200">
                <a
                  href={getTenantPublicUrl(companySlug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-between px-2 py-1.5 text-xs font-medium text-teal-900 hover:text-teal-950 transition min-w-0"
                  title={`Acessar ${getTenantDisplayDomain(companySlug)}`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Globe className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                    <span className="truncate font-mono text-[11px]">
                      {getTenantDisplayDomain(companySlug)}
                    </span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-teal-600 shrink-0 ml-1" />
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs shrink-0 cursor-pointer"
                  title={copied ? "Link copiado!" : "Copiar link do subdomínio"}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Lista dos 11 Módulos Oficiais */}
              <nav className="space-y-1 pt-1" aria-label="Navegação mobile">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(pathname, item);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-teal-700 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-white" : "text-slate-400"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Rodapé da Gaveta: Perfil do Usuário e Botão Sair / Desconectar */}
            <div className="border-t border-slate-100 pt-3 mt-4 space-y-2.5">
              <div className="px-1">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {fullName}
                </p>
                <p className="truncate text-[11px] text-slate-500">{userEmail}</p>
              </div>

              <form action={logoutAction} className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sair / Desconectar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
