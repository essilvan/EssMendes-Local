import { createClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";
import { getAllTenantsForSuperAdminAction } from "@/services/super-admin.actions";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const supabase = await createClient();

  // 1. Obter usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/super-admin");
  }

  // 2. Validar se o usuário possui role === 'super_admin' na tabela profiles
  let isSuperAdmin = false;

  try {
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && userProfile?.role === "super_admin") {
      isSuperAdmin = true;
    }
  } catch (err) {
    console.warn("[SuperAdminPage] Aviso ao consultar tabela profiles:", err);
  }

  // Fallback seguro de permissão (metadata ou tenant_users)
  if (!isSuperAdmin) {
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkIsSuperAdmin(user, tenantUser?.role)) {
      isSuperAdmin = true;
    }
  }

  // Caso contrário, redirecionar para /admin
  if (!isSuperAdmin) {
    redirect("/admin/dashboard");
  }

  // 3. Buscar todos os estabelecimentos cadastrados na tabela tenants e contagem de produtos
  const tenantsRes = await getAllTenantsForSuperAdminAction();
  const tenants = tenantsRes.data || [];

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("em_active_tenant_id")?.value;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <SuperAdminDashboard
          initialTenants={tenants}
          currentUserEmail={user.email}
          activeTenantId={activeTenantId}
        />
      </div>
    </div>
  );
}
