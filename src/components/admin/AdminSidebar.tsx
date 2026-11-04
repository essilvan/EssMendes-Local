"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/services/auth.actions";
import {
  Sparkles,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  CarFront,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { getTenantPublicUrl } from "@/utils/tenant-url";
import type { TenantPermissions } from "@/types";
import {
  getModularNavSections,
  isNavItemActive,
  isAutomotiveTenantNiche,
  type AdminNavSection,
} from "./admin-navigation";

export interface AdminSidebarProps {
  companyName: string;
  companySlug: string;
  userEmail: string;
  fullName: string;
  isSuperAdmin?: boolean;
  userRole?: string | null;
  tenantNiche?: string | null;
  permissions?: TenantPermissions | null;
}

export function AdminSidebar({
  companyName,
  companySlug,
  userEmail,
  fullName,
  isSuperAdmin = false,
  userRole = "tenant_owner",
  tenantNiche = "general",
  permissions,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [copied, setCopied] = React.useState(false);

  const tenantSiteUrl = getTenantPublicUrl(companySlug);
  const effectiveSuperAdmin = isSuperAdmin || userRole === "super_admin";
  const isAutomotive = isAutomotiveTenantNiche(tenantNiche);

  const copyToClipboard = async (url: string) => {
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

  const sections: AdminNavSection[] = getModularNavSections({
    permissions,
    isSuperAdmin: effectiveSuperAdmin,
    tenantNiche,
    userRole,
    companySlug,
  });

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 overflow-y-auto">
      {/* Top Branding & Nav */}
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 font-bold text-white shadow-sm">
            EM
          </div>
          <div className="overflow-hidden">
            <h2 className="truncate text-sm font-bold text-slate-900 leading-tight">
              {companyName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-medium text-teal-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                EssMendes Local
              </span>
              {isAutomotive && (
                <span className="inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-blue-800">
                  <CarFront className="h-2.5 w-2.5" />
                  Auto
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Super Admin Back Shortcut */}
        {effectiveSuperAdmin && (
          <div className="px-1">
            <Link
              href="/super-admin"
              className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Painel Super Admin
              </span>
              <ExternalLink className="h-3 w-3 text-amber-700" />
            </Link>
          </div>
        )}

        {/* Public Page Showcase Badge */}
        <div className="px-1">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-neutral-900 rounded-lg border border-neutral-800 text-xs text-neutral-300">
            <a
              href={tenantSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-400 hover:underline flex items-center gap-1.5"
            >
              <span>🌐 Meu Site</span>
            </a>
            <div className="flex items-center gap-2">
              <a
                href={tenantSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir meu site"
                className="text-neutral-400 hover:text-white transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(tenantSiteUrl)}
                title={copied ? "Link copiado!" : "Copiar link do meu site"}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modular Navigation Sections */}
        <nav className="space-y-4 pt-1" aria-label="Navegação desktop">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <div className="px-3 pb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-teal-700 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span className="flex items-center gap-3 truncate">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-white" : "text-slate-400"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    {item.external && (
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
        <div className="px-2">
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
            <LogOut className="h-4 w-4" />
            <span>Sair / Desconectar</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
export default AdminSidebar;
