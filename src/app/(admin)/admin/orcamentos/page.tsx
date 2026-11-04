import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { AlertCircle } from "lucide-react";
import { VehicleQuotesClient } from "@/components/admin/VehicleQuotesClient";
import type {
  VehicleQuote,
  VehicleMaintenanceSchedule,
  VehicleInspection,
} from "@/types";

export const dynamic = "force-dynamic";

interface AdminOrcamentosPageProps {
  searchParams?: Promise<{
    placa?: string;
    status?: string;
  }>;
}

export default async function AdminOrcamentosPage({
  searchParams,
}: AdminOrcamentosPageProps) {
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

  const resolvedParams = searchParams ? await searchParams : {};
  const initialPlateFilter = resolvedParams?.placa || "";
  const initialStatusFilter = resolvedParams?.status || "all";

  const tenantId = tenantData.tenantId;
  const supabase = createAdminClient();

  const [quotesRes, schedulesRes, inspectionsRes, tenantRes, profileRes] =
    await Promise.all([
      supabase
        .from("vehicle_quotes")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_maintenance_schedules")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("due_date", { ascending: true }),
      supabase
        .from("vehicle_inspections")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
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

  if (quotesRes.error) {
    console.error(
      "[AdminOrcamentosPage] Erro ao carregar vehicle_quotes:",
      quotesRes.error
    );
  }

  const quotes = (quotesRes.data || []) as VehicleQuote[];
  const schedules = (schedulesRes.data || []) as VehicleMaintenanceSchedule[];
  const inspections = (inspectionsRes.data || []) as VehicleInspection[];

  const tenantName =
    tenantRes.data?.name ||
    profileRes.data?.name ||
    tenantData.tenant?.name ||
    "Nossa Oficina";

  return (
    <VehicleQuotesClient
      initialQuotes={quotes}
      initialSchedules={schedules}
      initialInspections={inspections}
      tenantName={tenantName}
      initialPlateFilter={initialPlateFilter}
      initialStatusFilter={initialStatusFilter}
    />
  );
}
