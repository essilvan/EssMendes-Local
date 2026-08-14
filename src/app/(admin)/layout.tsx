import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Busca dados do tenant
  const { data: tenantUserData } = await supabase
    .from("tenant_users")
    .select("role, tenants (id, name, slug)")
    .eq("user_id", user.id)
    .maybeSingle();

  const rawTenant = tenantUserData?.tenants;
  const tenant = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant;

  const fullName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Proprietário(a)";
  const companyName =
    tenant?.name ||
    user.user_metadata?.company_name ||
    "Meu Estabelecimento";
  const companySlug = tenant?.slug || "meu-negocio";

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar Fixa Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        <AdminSidebar
          companyName={companyName}
          companySlug={companySlug}
          userEmail={user.email || ""}
          fullName={fullName}
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
            <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
              {companyName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href="/admin/dashboard"
              className="text-slate-600 font-medium hover:text-teal-700"
            >
              Início
            </a>
            <a
              href="/admin/servicos"
              className="text-slate-600 font-medium hover:text-teal-700"
            >
              Serviços
            </a>
            <a
              href="/admin/configuracoes"
              className="text-slate-600 font-medium hover:text-teal-700"
            >
              Ajustes
            </a>
          </div>
        </header>

        {/* Conteúdo das Páginas */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
