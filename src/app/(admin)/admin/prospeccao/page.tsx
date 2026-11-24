import { redirect } from "next/navigation";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ProspectingManagerClient,
  type ProspectingLead,
} from "@/components/admin/ProspectingManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminProspeccaoPage() {
  const { data: authContext, error } = await getAuthenticatedTenant();

  if (error || !authContext) {
    redirect("/login");
  }

  if (!authContext.isSuperAdmin && authContext.role !== "super_admin") {
    redirect("/admin/dashboard?error=recurso_indisponivel");
  }

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("prospecting_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const evolutionEnabled = Boolean(
    process.env.EVOLUTION_API_URL?.trim() &&
      process.env.EVOLUTION_API_KEY?.trim() &&
      process.env.EVOLUTION_INSTANCE_NAME?.trim()
  );

  return (
    <ProspectingManagerClient
      initialLeads={(rows || []) as ProspectingLead[]}
      evolutionEnabled={evolutionEnabled}
    />
  );
}
