import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { getAdminMenuDataAction } from "@/services/restaurant.actions";
import { MenuManagerClient } from "@/components/admin/MenuManagerClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCardapioPage() {
  const { data: authContext, error } = await getAuthenticatedTenant();

  if (error || !authContext) {
    redirect("/login");
  }

  const res = await getAdminMenuDataAction();
  const categories = res.data?.categories || [];
  const items = res.data?.items || [];

  return (
    <MenuManagerClient
      tenantId={authContext.tenantId}
      initialCategories={categories}
      initialItems={items}
    />
  );
}

