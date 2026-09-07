import React from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Scissors,
  ShoppingBag,
  Sparkles,
  Star,
  Newspaper,
  BarChart3,
  CreditCard,
  Settings,
  Building2,
} from "lucide-react";
import type { TenantPermissions } from "@/types";

export interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  key: keyof TenantPermissions;
  superAdminOnly?: boolean;
}

/**
 * Lista canônica dos 11 módulos oficiais de navegação do EssMendes Local.
 * Compartilhada estritamente entre a Sidebar Desktop e o Drawer/Sheet Mobile:
 * 1. 📊 Dashboard (dashboard) -> /admin
 * 2. 📅 Agendamentos (appointments) -> /admin/agendamentos
 * 3. 🛠️ Serviços (services) -> /admin/servicos
 * 4. 🛍️ Vitrine Produtos (products) -> /admin/produtos
 * 5. 🔄 Antes & Depois (before_after) -> /admin/antes-depois
 * 6. ⭐ Avaliações Google (reviews) -> /admin/avaliacoes
 * 7. 🚀 Posts & SEO (posts_seo) -> /admin/posts-seo
 * 8. 📈 Resultados & Relatórios (reports) -> /admin/relatorios
 * 9. 👑 Assinatura Pro (subscription_pro) -> /admin/assinatura
 * 10. 💳 Faturamento & Planos (billing_plans) -> /admin/faturamento
 * 11. ⚙️ Configurações (settings) -> /admin/configuracoes
 */
export const ADMIN_NAV_MODULES: AdminNavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    key: "dashboard",
  },
  {
    name: "Agendamentos",
    href: "/admin/agendamentos",
    icon: CalendarCheck,
    key: "appointments",
  },
  {
    name: "Serviços",
    href: "/admin/servicos",
    icon: Scissors,
    key: "services",
  },
  {
    name: "Vitrine Produtos",
    href: "/admin/produtos",
    icon: ShoppingBag,
    key: "products",
  },
  {
    name: "Antes & Depois",
    href: "/admin/antes-depois",
    icon: Sparkles,
    key: "before_after",
  },
  {
    name: "Avaliações Google",
    href: "/admin/avaliacoes",
    icon: Star,
    key: "reviews",
  },
  {
    name: "Posts & SEO",
    href: "/admin/posts-seo",
    icon: Newspaper,
    key: "posts_seo",
  },
  {
    name: "Resultados & Relatórios",
    href: "/admin/relatorios",
    icon: BarChart3,
    key: "reports",
  },
  {
    name: "Assinatura Pro",
    href: "/admin/assinatura",
    icon: CreditCard,
    key: "subscription_pro",
  },
  {
    name: "Faturamento & Planos",
    href: "/admin/faturamento",
    icon: Sparkles,
    key: "billing_plans",
  },
  {
    name: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
    key: "settings",
  },
];

/**
 * Módulos técnicos restritos exclusivamente ao Super Admin.
 */
export const SUPER_ADMIN_NAV_MODULES: AdminNavItem[] = [
  {
    name: "Integrações Google",
    href: "/admin/integracoes",
    icon: Building2,
    key: "settings",
    superAdminOnly: true,
  },
];

/**
 * Verifica se uma rota está ativa considerando aliases e sub-rotas.
 */
export function isNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.key === "dashboard") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }
  if (item.key === "before_after") {
    return (
      pathname.startsWith("/admin/antes-depois") ||
      pathname.startsWith("/admin/portfolio") ||
      pathname.startsWith("/admin/antes-e-depois")
    );
  }
  if (item.key === "posts_seo") {
    return (
      pathname.startsWith("/admin/posts-seo") ||
      pathname.startsWith("/admin/posts")
    );
  }
  if (item.key === "reports") {
    return (
      pathname.startsWith("/admin/relatorios") ||
      pathname.startsWith("/admin/resultados")
    );
  }
  if (item.key === "settings") {
    return (
      pathname.startsWith("/admin/configuracoes") ||
      pathname.startsWith("/admin/perfil")
    );
  }
  return pathname.startsWith(item.href);
}

/**
 * Filtra os módulos rigorosamente pelas permissões do lojista.
 */
export function getFilteredNavItems(
  permissions?: TenantPermissions | null,
  isSuperAdmin = false
): AdminNavItem[] {
  const baseItems = ADMIN_NAV_MODULES.filter((item) => {
    if (isSuperAdmin) {
      return true;
    }
    if (!permissions) {
      return true;
    }

    // Regra rigorosa: tenant.permissions[item.key] !== false
    // Compatibilidade com fallback de chaves legadas
    if (item.key === "products" && permissions.products === false && permissions.showcase === false) {
      return false;
    }
    if (item.key === "subscription_pro" && permissions.subscription_pro === false && permissions.billing === false) {
      return false;
    }
    if (item.key === "billing_plans" && permissions.billing_plans === false && permissions.billing === false) {
      return false;
    }

    return permissions[item.key] !== false;
  });

  if (isSuperAdmin) {
    return [...baseItems, ...SUPER_ADMIN_NAV_MODULES];
  }

  return baseItems;
}
