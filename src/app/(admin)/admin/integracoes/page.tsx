import { getGoogleIntegrationStatus } from "@/services/integration.actions";
import { GoogleIntegrationManager } from "@/components/admin/GoogleIntegrationManager";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { redirect } from "next/navigation";
import { Building2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminIntegracoesPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar integrações</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Estabelecimento não localizado."}
        </p>
      </div>
    );
  }

  const statusRes = await getGoogleIntegrationStatus();
  const initialStatus = statusRes.data || {
    isConnected: false,
    syncStatus: "idle",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
          <Building2 className="h-3.5 w-3.5" />
          <span>Conexões & Sincronização Externa</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Integrações ➔ Google Business Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Gerencie o canal de sincronização direta com o Google Meu Negócio para importar dados de endereço, notas reais e avaliações.
        </p>
      </div>

      <GoogleIntegrationManager initialStatus={initialStatus} />
    </div>
  );
}
