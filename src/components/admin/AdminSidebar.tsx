"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/services/auth.actions";
import {
  LayoutDashboard,
  Scissors,
  CalendarCheck,
  Sparkles,
  CreditCard,
  Settings,
  Globe,
  LogOut,
  ExternalLink,
  Star,
  Newspaper,
  ShoppingBag,
  BarChart3,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface AdminSidebarProps {
  companyName: string;
  companySlug: string;
  userEmail: string;
  fullName: string;
  isSuperAdmin?: boolean;
}

export function AdminSidebar({
  companyName,
  companySlug,
  userEmail,
  fullName,
  isSuperAdmin = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const allNavItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/admin/dashboard",
      superAdminOnly: false,
    },
    {
      name: "Agendamentos",
      href: "/admin/agendamentos",
      icon: CalendarCheck,
      current: pathname.startsWith("/admin/agendamentos"),
      superAdminOnly: false,
    },
    {
      name: "Serviços",
      href: "/admin/servicos",
      icon: Scissors,
      current: pathname.startsWith("/admin/servicos"),
      superAdminOnly: false,
    },
    {
      name: "Vitrine Produtos",
      href: "/admin/produtos",
      icon: ShoppingBag,
      current: pathname.startsWith("/admin/produtos"),
      superAdminOnly: false,
    },
    {
      name: "Antes & Depois",
      href: "/admin/portfolio",
      icon: Sparkles,
      current: pathname.startsWith("/admin/portfolio"),
      superAdminOnly: false,
    },
    {
      name: "Avaliações Google",
      href: "/admin/avaliacoes",
      icon: Star,
      current: pathname.startsWith("/admin/avaliacoes"),
      superAdminOnly: false,
    },
    {
      name: "Posts & SEO",
      href: "/admin/posts",
      icon: Newspaper,
      current: pathname.startsWith("/admin/posts"),
      superAdminOnly: false,
    },
    {
      name: "Resultados & Relatórios",
      href: "/admin/resultados",
      icon: BarChart3,
      current: pathname.startsWith("/admin/resultados"),
      superAdminOnly: false,
    },
    {
      name: "Integrações Google",
      href: "/admin/integracoes",
      icon: Building2,
      current: pathname.startsWith("/admin/integracoes"),
      superAdminOnly: true, // Oculto para lojista comum para simplificar a interface
    },
    {
      name: "Faturamento",
      href: "/admin/faturamento",
      icon: CreditCard,
      current: pathname.startsWith("/admin/faturamento"),
      superAdminOnly: false,
    },
    {
      name: "Configurações",
      href: "/admin/configuracoes",
      icon: Settings,
      current: pathname.startsWith("/admin/configuracoes"),
      superAdminOnly: false,
    },
  ];

  // Se não for super admin, oculta configurações técnicas complexas de APIs
  const navigation = allNavItems.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) {
      return false;
    }
    return true;
  });

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

        {/* Public Page Button */}
        <div className="px-1">
          <Link
            href={`/${companySlug}`}
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-teal-100 bg-teal-50/60 px-3 py-2 text-xs font-medium text-teal-900 hover:bg-teal-100/70 transition"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-teal-700" />
              Ver Página Pública
            </span>
            <ExternalLink className="h-3 w-3 text-teal-600" />
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  item.current
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    item.current ? "text-white" : "text-slate-400"
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
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Encerrar Sessão</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
