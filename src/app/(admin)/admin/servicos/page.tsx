import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { ServicesManager, type ServiceItem } from "@/components/admin/ServicesManager";
import { redirect } from "next/navigation";
import { Scissors, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar estabelecimento</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Nenhum estabelecimento associado encontrado para esta conta."}
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Busca lista de serviços do tenant
  const { data: rawServices, error: servicesError } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenantContext.tenantId)
    .order("created_at", { ascending: false });

  if (servicesError) {
    console.error("[ServicosPage] Erro ao buscar serviços:", servicesError);
  }

  const services: ServiceItem[] = (rawServices || []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: Number(s.price),
    duration_minutes: Number(s.duration_minutes),
    is_active: Boolean(s.is_active),
    created_at: s.created_at,
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
          <Scissors className="h-3.5 w-3.5" />
          <span>Gestão de Serviços</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Tabela & Catálogo de Serviços
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Organize seus procedimentos, durações e preços oferecidos aos seus clientes.
        </p>
      </div>

      {servicesError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">Erro ao carregar lista de serviços do banco de dados:</p>
            <p className="mt-0.5">{servicesError.message}</p>
          </div>
        </div>
      )}

      {/* Gerenciador */}
      <ServicesManager initialServices={services} />

    </div>
  );
}
