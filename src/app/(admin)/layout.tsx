import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { OverdueBlockScreen } from "@/components/admin/OverdueBlockScreen";
import { clearManagedTenantAction } from "@/services/super-admin.actions";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, X } from "lucide-react";
import { getTenantPublicUrl } from "@/utils/tenant-url";

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
          />
        </div>

        {/* Área Principal de Conteúdo */}
        <div className="flex flex-1 flex-col md:pl-64">
          {/* Mobile Header */}
          <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-700 font-bold text-white text-xs">
                EM
              </div>
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {companyName}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs overflow-x-auto">
              <Link
                href="/admin/dashboard"
                className="text-slate-600 font-medium hover:text-teal-700 shrink-0"
              >
                Início
              </Link>
              <Link
                href="/admin/produtos"
                className="text-slate-600 font-medium hover:text-teal-700 shrink-0"
              >
                Produtos
              </Link>
              <Link
                href="/admin/avaliacoes"
                className="text-slate-600 font-medium hover:text-teal-700 shrink-0"
              >
                Avaliações
              </Link>
              <Link
                href="/admin/agendamentos"
                className="text-slate-600 font-medium hover:text-teal-700 shrink-0"
              >
                Agenda
              </Link>
              <a
                href={getTenantPublicUrl(companySlug)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 font-bold hover:text-teal-800 shrink-0 inline-flex items-center gap-1"
              >
                <span>Vitrine</span>
              </a>
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  className="font-bold text-amber-700 hover:text-amber-800 shrink-0"
                >
                  Super Admin
                </Link>
              )}
            </div>
          </header>

          {/* Conteúdo das Páginas */}
          <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
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
