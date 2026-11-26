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
  const [res, { data: tenantRow }, { data: profileRow }, { data: menuRows }] =
    await Promise.all([
      getAdminOrdersDataAction(),
      supabase
        .from("tenants")
        .select(
          "name, google_review_url, google_place_id, service_fee_enabled, service_fee_percent"
        )
        .eq("id", authContext.tenantId)
        .maybeSingle(),
      supabase
        .from("tenant_profiles")
        .select("address")
        .eq("tenant_id", authContext.tenantId)
        .maybeSingle(),
      supabase
        .from("menu_items")
        .select("id, name, category")
        .eq("tenant_id", authContext.tenantId),
    ]);

  const menuItemCategories: Record<string, string> = {};
  (menuRows || []).forEach((m: any) => {
    if (m?.id && m?.category) {
      menuItemCategories[String(m.id)] = String(m.category);
    }
    if (m?.name && m?.category) {
      menuItemCategories[String(m.name).trim().toLowerCase()] = String(
        m.category
      );
    }
  });

  const orders = res.data || [];

  return (
    <OrdersManagerClient
      initialOrders={orders}
      tenantId={authContext.tenantId}
      tenantName={tenantRow?.name || authContext.tenant?.name || "Restaurante"}
      googleReviewUrl={tenantRow?.google_review_url || null}
      googlePlaceId={tenantRow?.google_place_id || null}
      tenantAddress={profileRow?.address || null}
      serviceFeeEnabled={Boolean(tenantRow?.service_fee_enabled)}
      serviceFeePercent={Number(tenantRow?.service_fee_percent ?? 10)}
      menuItemCategories={menuItemCategories}
    />
  );
}

