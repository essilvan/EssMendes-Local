import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { getAdminOrdersDataAction } from "@/services/restaurant.actions";
import { OrdersManagerClient } from "@/components/admin/OrdersManagerClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const { data: authContext, error } = await getAuthenticatedTenant();

  if (error || !authContext) {
    redirect("/login");
  }

  const res = await getAdminOrdersDataAction();
  const orders = res.data || [];

  return <OrdersManagerClient initialOrders={orders} tenantId={authContext.tenantId} />;
}

