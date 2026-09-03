import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { PortfolioManager } from "@/components/admin/PortfolioManager";
import { redirect } from "next/navigation";
import { Sparkles, AlertCircle } from "lucide-react";
import type { PortfolioItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao acessar portfólio</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Estabelecimento não localizado."}
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Busca perfil do estabelecimento para personalização do card e WhatsApp
  const { data: profile } = await supabase
    .from("tenant_profiles")
    .select("name, phone_whatsapp, phone")
    .eq("tenant_id", tenantContext.tenantId)
    .maybeSingle();

  const businessName = profile?.name || tenantContext.tenant?.name || "Nosso Estabelecimento";
  const whatsapp = profile?.phone_whatsapp || profile?.phone || "";
  const slug = tenantContext.tenant?.slug || "";

  // Busca itens de portfólio do tenant
  const { data: rawItems, error: itemsError } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("tenant_id", tenantContext.tenantId)
    .order("created_at", { ascending: false });

  if (itemsError) {
    console.error("[AdminPortfolioPage] Erro ao buscar portfolio_items:", itemsError);
  }

  const items = (rawItems || []) as PortfolioItem[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>Portfólio & Transformações</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Antes & Depois dos Serviços
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre fotos comparativas para demonstrar a excelência do seu trabalho e converter mais visitantes em clientes.
        </p>
      </div>

      {itemsError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">Erro ao carregar transformações:</p>
            <p className="mt-0.5">{itemsError.message}</p>
          </div>
        </div>
      )}

      {/* Gerenciador */}
      <PortfolioManager
        initialItems={items}
        businessName={businessName}
        whatsapp={whatsapp}
        slug={slug}
      />
    </div>
  );
}
