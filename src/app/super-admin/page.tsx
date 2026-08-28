import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant, checkIsSuperAdmin } from "@/lib/supabase/tenant";
import { getAllTenantsForSuperAdminAction } from "@/services/super-admin.actions";
import { SuperAdminManager } from "@/components/super-admin/SuperAdminManager";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/super-admin");
  }

  // Verifica papel do usuário
  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isSuper = checkIsSuperAdmin(user, tenantUser?.role);

  // Se o usuário autenticado for lojista ('tenant_owner'), redireciona para o /admin de sua empresa
  if (!isSuper) {
    redirect("/admin/dashboard");
  }

  // Busca lista de todos os tenants cadastrados
  const tenantsRes = await getAllTenantsForSuperAdminAction();
  const tenants = tenantsRes.data || [];

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("em_active_tenant_id")?.value;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <SuperAdminManager
          initialTenants={tenants}
          currentUserEmail={user.email}
          activeImpersonatedTenantId={activeTenantId}
        />
      </div>
    </div>
  );
}
