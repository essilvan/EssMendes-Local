"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/services/auth.actions";
import {
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

interface AdminSidebarProps {
  companyName: string;
  companySlug: string;
  userEmail: string;
  fullName: string;
  isSuperAdmin?: boolean;
  permissions?: TenantPermissions | null;
}

export function AdminSidebar({
  companyName,
  companySlug,
  userEmail,
  fullName,
  isSuperAdmin = false,
  permissions,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const [copied, setCopied] = React.useState(false);

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

  const navigation: AdminNavItem[] = getFilteredNavItems(permissions, isSuperAdmin);

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-200 bg-white p-4">
      {/* Top Branding & Nav */}
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 font-bold text-white shadow-sm">
            EM
          </div>
          <div className="overflow-hidden">
            <h2 className="truncate text-sm font-bold text-slate-900 leading-tight">
              {companyName}
            </h2>
            <span className="text-[11px] font-medium text-teal-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              EssMendes Local
            </span>
          </div>
        </div>

        {/* Super Admin Back Shortcut */}
        {isSuperAdmin && (
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

        {/* Public Page Subdomain Showcase Button */}
        <div className="px-1">
          <div className="flex items-center gap-1 rounded-lg border border-teal-100 bg-teal-50/60 p-1 transition hover:border-teal-200">
            <a
              href={getTenantPublicUrl(companySlug)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-between px-2 py-1.5 text-xs font-medium text-teal-900 hover:text-teal-950 transition"
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
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1" aria-label="Navegação desktop">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.key}
                href={item.href}
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
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
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
