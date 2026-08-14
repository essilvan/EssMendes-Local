import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Shield,
  Sparkles,
  Scissors,
  Settings,
  Globe,
  ExternalLink,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao acessar painel</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Nenhum estabelecimento associado a esta conta."}
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Busca quantidade de serviços cadastrados
  let servicesCount = 0;
  const { count, error: countError } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantContext.tenantId);

  if (countError) {
    console.error("[AdminDashboardPage] Erro ao contar serviços:", countError);
  } else {
    servicesCount = count || 0;
  }

  const user = tenantContext.user;
  const fullName =
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Proprietário(a)";

  const companyName =
    tenantContext.tenant?.name ||
    (user.user_metadata?.company_name as string) ||
    "Meu Estabelecimento";

  const companySlug = tenantContext.tenant?.slug || "meu-negocio";
  const userRole = tenantContext.role || "owner";

  return (
    <div className="space-y-8">
      
      {/* Welcome Hero Banner */}
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-900 to-teal-800 p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-800/80 px-3 py-0.5 text-xs font-medium text-teal-200 ring-1 ring-white/10">
              <Sparkles className="h-3 w-3" />
              <span>Ambiente Ativo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Olá, {fullName}!
            </h1>
            <p className="text-sm text-teal-100/90">
              Bem-vindo(a) ao painel de controle do seu estabelecimento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${companySlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-teal-900 shadow-sm hover:bg-teal-50 transition"
            >
              <Globe className="h-4 w-4 text-teal-700" />
              <span>Visualizar Página Pública</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tenant Information Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Card: Empresa */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Estabelecimento
              </p>
              <h3 className="text-base font-bold text-slate-900">{companyName}</h3>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 flex justify-between">
            <span>Slug:</span>
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
              {companySlug}
            </code>
          </div>
        </div>

        {/* Card: Serviços Cadastrados */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Serviços Cadastrados
              </p>
              <h3 className="text-base font-bold text-slate-900">
                {servicesCount} {servicesCount === 1 ? "serviço" : "serviços"}
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 flex justify-between">
            <span>Status:</span>
            <Link
              href="/admin/servicos"
              className="font-medium text-teal-700 hover:underline inline-flex items-center gap-1"
            >
              Gerenciar catálogo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card: Nível de Acesso */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Nível de Acesso
              </p>
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {userRole}
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 flex justify-between">
            <span>Permissões:</span>
            <span className="font-medium text-emerald-700">Acesso Total</span>
          </div>
        </div>

      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/servicos"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300 hover:shadow-md transition"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
              Gerenciar Serviços & Preços
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adicione procedimentos, valores, tempo estimado e disponibilidade.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/configuracoes"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300 hover:shadow-md transition"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
              Editar Perfil do Estabelecimento
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atualize WhatsApp, endereço completo, descrição e logotipo do negócio.
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
}
