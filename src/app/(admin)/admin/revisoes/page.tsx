import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { AlertCircle } from "lucide-react";
import { MaintenanceSchedulesClient } from "@/components/admin/MaintenanceSchedulesClient";
import type { VehicleMaintenanceSchedule } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminRevisoesPage() {
  const { data: tenantData, error: tenantErr } = await getAuthenticatedTenant();

  if (tenantErr || !tenantData?.tenantId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <p className="font-bold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> Erro de autorização
        </p>
        <p className="text-sm mt-1">
          {tenantErr || "Estabelecimento não identificado."}
        </p>
      </div>
    );
  }

  const tenantId = tenantData.tenantId;
  const supabase = createAdminClient();

  const [schedulesRes, tenantRes, profileRes] = await Promise.all([
    supabase
      .from("vehicle_maintenance_schedules")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("due_date", { ascending: true }),
    supabase
      .from("tenants")
      .select("id, name")
      .eq("id", tenantId)
      .maybeSingle(),
    supabase
      .from("tenant_profiles")
      .select("name")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  if (schedulesRes.error) {
    console.error(
      "[AdminRevisoesPage] Erro ao carregar vehicle_maintenance_schedules:",
      schedulesRes.error
    );
  }

  const schedules = (schedulesRes.data || []) as VehicleMaintenanceSchedule[];

  const tenantName =
    tenantRes.data?.name ||
    profileRes.data?.name ||
    tenantData.tenant?.name ||
    "Nossa Oficina";

  return (
    <MaintenanceSchedulesClient
      initialSchedules={schedules}
      tenantName={tenantName}
    />
  );
}

