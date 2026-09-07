import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminPermissionNotice } from "@/components/admin/AdminPermissionNotice";
import { OverdueBlockScreen } from "@/components/admin/OverdueBlockScreen";
import { clearManagedTenantAction } from "@/services/super-admin.actions";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, X } from "lucide-react";
import { getTenantPublicUrl } from "@/utils/tenant-url";
import type { TenantPermissions } from "@/types";
import { DEFAULT_TENANT_PERMISSIONS } from "@/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    redirect("/login");
  }

  const user = tenantContext.user;
  const tenant = tenantContext.tenant;
  const isSuperAdmin = tenantContext.isSuperAdmin;
  const isImpersonating = tenantContext.isImpersonating;

  const fullName =
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Proprietário(a)";

  const companyName =
    tenant?.name ||
    (user.user_metadata?.company_name as string) ||
    "Meu Estabelecimento";

  const companySlug = tenant?.slug || "meu-negocio";

  const headerList = await headers();
  const currentPath = headerList.get("x-pathname") || "";

  const permissions: TenantPermissions = {
    dashboard: tenant?.permissions?.dashboard ?? true,
    appointments: tenant?.permissions?.appointments ?? true,
    services: tenant?.permissions?.services ?? true,
    products: tenant?.permissions?.products ?? tenant?.permissions?.showcase ?? true,
    before_after: tenant?.permissions?.before_after ?? true,
    reviews: tenant?.permissions?.reviews ?? true,
    posts_seo: tenant?.permissions?.posts_seo ?? true,
    reports: tenant?.permissions?.reports ?? true,
    subscription_pro: tenant?.permissions?.subscription_pro ?? tenant?.permissions?.billing ?? true,
    billing_plans: tenant?.permissions?.billing_plans ?? tenant?.permissions?.billing ?? true,
    settings: tenant?.permissions?.settings ?? true,
    showcase: tenant?.permissions?.showcase ?? true,
    billing: tenant?.permissions?.billing ?? true,
  };

  // Proteção de Rotas Baseada em Permissões por Estabelecimento (para lojistas comuns)
  if (!isSuperAdmin) {
    // 1. Bloqueio de rotas exclusivas do Super Admin
    if (currentPath.startsWith("/admin/integracoes")) {
      redirect("/admin/dashboard?error=recurso_indisponivel");
    }

    // 2. Mapeamento de rotas e suas respectivas permissões
    const permissionRouteMap: { prefix: string; key: keyof TenantPermissions }[] = [
      { prefix: "/admin/agendamentos", key: "appointments" },
      { prefix: "/admin/servicos", key: "services" },
      { prefix: "/admin/produtos", key: "products" },
      { prefix: "/admin/portfolio", key: "before_after" },
      { prefix: "/admin/antes-e-depois", key: "before_after" },
      { prefix: "/admin/antes-depois", key: "before_after" },
      { prefix: "/admin/avaliacoes", key: "reviews" },
      { prefix: "/admin/posts-seo", key: "posts_seo" },
      { prefix: "/admin/posts", key: "posts_seo" },
      { prefix: "/admin/relatorios", key: "reports" },
      { prefix: "/admin/resultados", key: "reports" },
      { prefix: "/admin/assinatura", key: "subscription_pro" },
      { prefix: "/admin/faturamento", key: "billing_plans" },
      { prefix: "/admin/configuracoes", key: "settings" },
      { prefix: "/admin/perfil", key: "settings" },
      { prefix: "/admin/dashboard", key: "dashboard" },
      { prefix: "/admin", key: "dashboard" },
    ];

    const matched = permissionRouteMap.find((item) => currentPath.startsWith(item.prefix));
    if (matched && permissions[matched.key] === false) {
      redirect("/admin/dashboard?error=recurso_indisponivel");
    }
  }

  const isOverdue = !isSuperAdmin && tenant?.subscription_status === "overdue";
  const isAssinaturaPage = currentPath.includes("/admin/assinatura");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Barra Superior Discreta do Super Admin */}
      {isSuperAdmin && (
        <aside
          aria-label="Aviso de Super Admin"
          className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-950 shrink-0" />
            <span>
              Você está gerenciando a empresa <strong>{companyName}</strong> —{" "}
              <Link
                href="/super-admin"
                className="underline font-bold hover:text-slate-800 transition"
              >
                [Voltar ao Painel Master Super Admin]
              </Link>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/super-admin"
              className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-slate-900 transition"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Voltar ao Painel Master Super Admin</span>
            </Link>
            <form action={clearManagedTenantAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                <X className="h-3 w-3" />
                <span>Encerrar</span>
              </button>
            </form>
          </div>
        </aside>
      )}

      <div className="flex flex-1">
        {/* Sidebar Fixa Desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
          <AdminSidebar
            companyName={companyName}
            companySlug={companySlug}
            userEmail={user.email || ""}
            fullName={fullName}
            isSuperAdmin={isSuperAdmin}
            permissions={permissions}
          />
        </div>

        {/* Área Principal de Conteúdo */}
        <div className="flex flex-1 flex-col md:pl-64">
          {/* Topbar e Gaveta Lateral Mobile (Drawer) */}
          <AdminMobileNav
            companyName={companyName}
            companySlug={companySlug}
            userEmail={user.email || ""}
            fullName={fullName}
            isSuperAdmin={isSuperAdmin}
            permissions={permissions}
          />

          {/* Conteúdo das Páginas */}
          <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
            <AdminPermissionNotice />

            {isOverdue && !isAssinaturaPage ? (
              <OverdueBlockScreen
                tenant={{
                  id: tenantContext.tenantId,
                  name: companyName,
                  slug: companySlug,
                }}
                userEmail={user.email || ""}
              />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
