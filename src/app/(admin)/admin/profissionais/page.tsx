import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { AlertCircle, Users, Sparkles } from "lucide-react";
import { ProfessionalsClient } from "@/components/admin/ProfessionalsClient";
import type { TenantProfessional } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProfissionaisPage() {
  const { data: tenantData, error: tenantErr } = await getAuthenticatedTenant();

  if (tenantErr || !tenantData?.tenantId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <p className="font-bold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> Erro de autorização
        </p>
        <p className="text-sm mt-1">{tenantErr || "Estabelecimento não identificado."}</p>
      </div>
    );
  }

  const tenantId = tenantData.tenantId;
  const supabase = await createClient();

  const [profRes, tenantRowRes] = await Promise.all([
    supabase
      .from("tenant_professionals")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true }),
    supabase
      .from("tenants")
      .select("theme_settings")
      .eq("id", tenantId)
      .maybeSingle(),
  ]);

  if (profRes.error) {
    console.error("[AdminProfissionaisPage] Erro ao carregar profissionais:", profRes.error);
  }

  const routingMap: Record<
    string,
    { receives_quotes?: boolean; is_primary_quote_contact?: boolean }
  > =
    (tenantRowRes.data?.theme_settings as any)?.quote_routing_professionals ||
    {};

  const professionals: TenantProfessional[] = (profRes.data || []).map((p: any) => {
    const fallback = routingMap[p.id];
    const receivesQuotes =
      typeof p.receives_quotes === "boolean"
        ? p.receives_quotes
        : typeof fallback?.receives_quotes === "boolean"
        ? fallback.receives_quotes
        : true;
    const isPrimary =
      typeof p.is_primary_quote_contact === "boolean"
        ? p.is_primary_quote_contact
        : typeof fallback?.is_primary_quote_contact === "boolean"
        ? fallback.is_primary_quote_contact
        : false;

    return {
      ...p,
      receives_quotes: receivesQuotes,
      is_primary_quote_contact: isPrimary,
    } as TenantProfessional;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-teal-700" />
            <span>Equipe & Profissionais</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cadastre seus profissionais e atendentes com WhatsApp individual para direcionar as confirmações de agendamento.
          </p>
        </div>
      </div>

      {/* Main Interactive Client */}
      <ProfessionalsClient initialProfessionals={professionals} tenantId={tenantId} />
    </div>
  );
}
