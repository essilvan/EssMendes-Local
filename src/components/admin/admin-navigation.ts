import React from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Scissors,
  ShoppingBag,
  Sparkles,
  Star,
  Newspaper,
  BarChart3,
  CreditCard,
  Settings,
  Building2,
  CarFront,
  Wrench,
  Globe,
  ShieldCheck,
} from "lucide-react";
import type { TenantPermissions } from "@/types";

export type NavBlockType = "common" | "automotive" | "appointment" | "super_admin";

export interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  key: keyof TenantPermissions | "super_admin_tenants" | "public_site";
  block: NavBlockType;
  superAdminOnly?: boolean;
  external?: boolean;
}

export interface AdminNavSection {
  id: NavBlockType;
  title: string;
  items: AdminNavItem[];
}

/**
 * Verifica se o nicho do tenant corresponde ao segmento automotivo ('automotive', 'auto', 'automotivo', 'mecanica')
 */
export function isAutomotiveTenantNiche(niche?: string | null): boolean {
  const normalized = String(niche || "")
    .trim()
    .toLowerCase();
  return (
    normalized === "automotive" ||
    normalized === "auto" ||
    normalized.includes("auto") ||
    normalized.includes("mecanic") ||
    normalized.includes("mecânic") ||
    normalized.includes("oficina")
  );
}

/**
 * Lista canônica dos módulos oficiais de navegação do EssMendes Local,
 * estruturados por bloco funcional (Comum, Automotivo, Agendamento Convencional e Super Admin).
 */
export const ADMIN_NAV_MODULES: AdminNavItem[] = [
  // BLOCO COMUM
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    key: "dashboard",
    block: "common",
  },
  // BLOCO AUTOMOTIVO (Apenas tenant.niche === 'automotive' | 'auto')
  {
    name: "Orçamentos por Placa",
    href: "/admin/orcamentos",
    icon: CarFront,
    key: "vehicle_quotes",
    block: "automotive",
  },
  {
    name: "Revisões Preventivas",
    href: "/admin/revisoes",
    icon: Wrench,
    key: "maintenance_schedules",
    block: "automotive",
  },
  // BLOCO AGENDAMENTO CONVENCIONAL (Apenas tenant.niche !== 'automotive')
  {
    name: "Agendamentos",
    href: "/admin/agendamentos",
    icon: CalendarCheck,
    key: "appointments",
    block: "appointment",
  },
  // BLOCO COMUM (Continuação)
  {
    name: "Serviços & Preços",
    href: "/admin/servicos",
    icon: Scissors,
    key: "services",
    block: "common",
  },
  {
    name: "Profissionais",
    href: "/admin/profissionais",
    icon: Users,
    key: "professionals",
    block: "common",
  },
  {
    name: "Vitrine Produtos",
    href: "/admin/produtos",
    icon: ShoppingBag,
    key: "products",
    block: "common",
  },
  {
    name: "Antes & Depois",
    href: "/admin/antes-depois",
    icon: Sparkles,
    key: "before_after",
    block: "common",
  },
  {
    name: "Avaliações Google",
    href: "/admin/avaliacoes",
    icon: Star,
    key: "reviews",
    block: "common",
  },
  {
    name: "Posts & SEO",
    href: "/admin/posts-seo",
    icon: Newspaper,
    key: "posts_seo",
    block: "common",
  },
  {
    name: "Resultados & Relatórios",
    href: "/admin/relatorios",
    icon: BarChart3,
    key: "reports",
    block: "common",
  },
  {
    name: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
    key: "settings",
    block: "common",
  },
];

/**
 * BLOCO SUPER ADMIN — Renderizado ESTRITAMENTE se profile.role === 'super_admin' (ou isSuperAdmin === true).
 * Oculto completamente para tenant_owner, tenant_admin e staff.
 */
export const SUPER_ADMIN_NAV_MODULES: AdminNavItem[] = [
  {
    name: "Gestão de Tenants",
    href: "/super-admin",
    icon: ShieldCheck,
    key: "super_admin_tenants",
    block: "super_admin",
    superAdminOnly: true,
  },
  {
    name: "Faturamento & Planos",
    href: "/admin/faturamento",
    icon: Sparkles,
    key: "billing_plans",
    block: "super_admin",
    superAdminOnly: true,
  },
  {
    name: "Assinatura Pro",
    href: "/admin/assinatura",
    icon: CreditCard,
    key: "subscription_pro",
    block: "super_admin",
    superAdminOnly: true,
  },
  {
    name: "Integrações Globais",
    href: "/admin/integracoes",
    icon: Building2,
    key: "settings",
    block: "super_admin",
    superAdminOnly: true,
  },
];

/**
 * Verifica se uma rota está ativa considerando aliases e sub-rotas.
 */
export function isNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.key === "public_site") {
    return false;
  }
  if (item.key === "dashboard") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }
  if (item.key === "professionals") {
    return (
      pathname.startsWith("/admin/profissionais") ||
      pathname.startsWith("/admin/equipe")
    );
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
  if (item.key === "settings" && !item.superAdminOnly) {
    return (
      pathname.startsWith("/admin/configuracoes") ||
      pathname.startsWith("/admin/perfil")
    );
  }
  return pathname.startsWith(item.href);
}

/**
 * Filtra os módulos rigorosamente pelo nicho do tenant, perfil RBAC (profile.role) e permissões.
 */
export function getFilteredNavItems(
  permissions?: TenantPermissions | null,
  isSuperAdmin = false,
  tenantNiche: string | null = "general",
  userRole: string | null = "tenant_owner",
  companySlug?: string
): AdminNavItem[] {
  const effectiveSuperAdmin = isSuperAdmin || userRole === "super_admin";
  const isAutomotive = isAutomotiveTenantNiche(tenantNiche);

  const publicSiteItem: AdminNavItem | null = companySlug
    ? {
        name: "Meu Site",
        href: `/${companySlug}`,
        icon: Globe,
        key: "public_site",
        block: "common",
        external: true,
      }
    : null;

  const filteredModules = ADMIN_NAV_MODULES.filter((item) => {
    // 1. Filtro Contextual Estrito por Nicho
    if (item.block === "automotive" && !isAutomotive) {
      return false;
    }
    if (item.block === "appointment" && isAutomotive) {
      return false;
    }

    // 2. Super Admin tem acesso a todos os itens contextuais do nicho
    if (effectiveSuperAdmin) {
      return true;
    }

    if (!permissions) {
      return true;
    }

    // 3. Filtro de Permissões por Tenant
    if (
      item.key === "products" &&
      permissions.products === false &&
      permissions.showcase === false
    ) {
      return false;
    }

    const permKey = item.key as keyof TenantPermissions;
    return permissions[permKey] !== false;
  });

  // Insere "Meu Site" logo após "Dashboard" no Bloco Comum se companySlug for fornecido
  const withPublicSite: AdminNavItem[] = [];
  for (const mod of filteredModules) {
    withPublicSite.push(mod);
    if (mod.key === "dashboard" && publicSiteItem) {
      withPublicSite.push(publicSiteItem);
    }
  }

  // 4. Bloco Super Admin: EXCLUSIVO para profile.role === 'super_admin'
  if (effectiveSuperAdmin) {
    return [...withPublicSite, ...SUPER_ADMIN_NAV_MODULES];
  }

  return withPublicSite;
}

/**
 * Retorna os blocos modulares agrupados para exibição estruturada na Sidebar.
 */
export function getModularNavSections(options: {
  permissions?: TenantPermissions | null;
  isSuperAdmin?: boolean;
  tenantNiche?: string | null;
  userRole?: string | null;
  companySlug?: string;
}): AdminNavSection[] {
  const {
    permissions,
    isSuperAdmin = false,
    tenantNiche = "general",
    userRole = "tenant_owner",
    companySlug,
  } = options;

  const allItems = getFilteredNavItems(
    permissions,
    isSuperAdmin,
    tenantNiche,
    userRole,
    companySlug
  );

  const isAutomotive = isAutomotiveTenantNiche(tenantNiche);
  const effectiveSuperAdmin = isSuperAdmin || userRole === "super_admin";

  const commonItems = allItems.filter((i) => i.block === "common");
  const automotiveItems = allItems.filter((i) => i.block === "automotive");
  const appointmentItems = allItems.filter((i) => i.block === "appointment");
  const superAdminItems = allItems.filter((i) => i.block === "super_admin");

  const sections: AdminNavSection[] = [];

  if (isAutomotive && automotiveItems.length > 0) {
    sections.push({
      id: "automotive",
      title: "Operação Automotiva",
      items: automotiveItems,
    });
  } else if (!isAutomotive && appointmentItems.length > 0) {
    sections.push({
      id: "appointment",
      title: "Atendimento & Agenda",
      items: appointmentItems,
    });
  }

  if (commonItems.length > 0) {
    sections.push({
      id: "common",
      title: "Gestão & Vitrine",
      items: commonItems,
    });
  }

  if (effectiveSuperAdmin && superAdminItems.length > 0) {
    sections.push({
      id: "super_admin",
      title: "Super Admin Global",
      items: superAdminItems,
    });
  }

  return sections;
}
