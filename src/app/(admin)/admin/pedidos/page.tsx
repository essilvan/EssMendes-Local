import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrdersDataAction } from "@/services/restaurant.actions";
import { OrdersManagerClient } from "@/components/admin/OrdersManagerClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const { data: authContext, error } = await getAuthenticatedTenant();

  if (error || !authContext) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const [res, { data: tenantRow }, { data: profileRow }] = await Promise.all([
    getAdminOrdersDataAction(),
    supabase
      .from("tenants")
      .select("name, google_review_url, google_place_id")
      .eq("id", authContext.tenantId)
      .maybeSingle(),
    supabase
      .from("tenant_profiles")
      .select("address")
      .eq("tenant_id", authContext.tenantId)
      .maybeSingle(),
  ]);

  const orders = res.data || [];

  return (
    <OrdersManagerClient
      initialOrders={orders}
      tenantId={authContext.tenantId}
      tenantName={tenantRow?.name || authContext.tenant?.name || "Restaurante"}
      googleReviewUrl={tenantRow?.google_review_url || null}
      googlePlaceId={tenantRow?.google_place_id || null}
      tenantAddress={profileRow?.address || null}
    />
  );
}

