import { getGoogleIntegrationStatus } from "@/services/integration.actions";
import { GoogleIntegrationManager } from "@/components/admin/GoogleIntegrationManager";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, AlertCircle, ShieldCheck, ArrowRight, Store } from "lucide-react";

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

  // Se for lojista comum (tenant_owner), oculta telas técnicas complexas de APIs
  if (!tenantContext.isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Sincronização Assistida</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Integrações & Conexões
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            A conexão com APIs do Google e serviços externos é operada em modo inteligente pela plataforma.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Integrações Técnicas Gerenciadas
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            Para garantir alta disponibilidade, otimização de SEO Local e segurança de credenciais, as integrações com a Google Places API são configuradas automaticamente pela administração da plataforma.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            Você pode personalizar fotos, horários de atendimento, endereço, WhatsApp e identidade visual diretamente no painel de perfil.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/admin/perfil"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition"
            >
              <span>Acessar Perfil da Empresa</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
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
          <span>Conexões & Sincronização Externa (Super Admin)</span>
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
