import { generateMonthlyExecutiveReportAction } from "@/services/report.actions";
import { ResultsManager } from "@/components/admin/ResultsManager";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { redirect } from "next/navigation";
import { BarChart3, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminResultadosPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar resultados</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Estabelecimento não localizado."}
        </p>
      </div>
    );
  }

  const reportRes = await generateMonthlyExecutiveReportAction();

  if (!reportRes.success || !reportRes.data) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-bold">Não foi possível consolidar as métricas no momento.</p>
        <p className="text-xs mt-1">{reportRes.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Métricas de Crescimento</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Painel de Resultados & Relatórios
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Acompanhe a evolução de acessos, conversões no WhatsApp e o relatório executivo gerado por Inteligência Artificial.
        </p>
      </div>

      <ResultsManager initialReport={reportRes.data} />
    </div>
  );
}
