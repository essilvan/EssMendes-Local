import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { getAdminTablesDataAction } from "@/services/restaurant.actions";
import { TablesManagerClient } from "@/components/admin/TablesManagerClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminMesasPage() {
  const { data: authContext, error } = await getAuthenticatedTenant();

  if (error || !authContext) {
    redirect("/login");
  }

  const res = await getAdminTablesDataAction();
  const tables = res.data?.tables || [];
  const professionals = res.data?.professionals || [];
  const tenantSlug = res.data?.tenantSlug || authContext.tenant?.slug || "restaurante";
  const tenantName = res.data?.tenantName || authContext.tenant?.name || "Restaurante";

  return (
    <TablesManagerClient
      tenantSlug={tenantSlug}
      tenantName={tenantName}
      initialTables={tables}
      professionals={professionals}
    />
  );
}

