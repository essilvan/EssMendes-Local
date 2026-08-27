import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { redirect } from "next/navigation";
import { ShoppingBag, AlertCircle } from "lucide-react";
import type { TenantProduct } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProdutosPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar produtos</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Estabelecimento não localizado."}
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Busca dados de perfil (para obter telefone de WhatsApp)
  const { data: profile } = await supabase
    .from("tenant_profiles")
    .select("phone_whatsapp, phone")
    .eq("tenant_id", tenantContext.tenantId)
    .maybeSingle();

  // Busca produtos do tenant com tratamento resiliente
  let products: TenantProduct[] = [];
  try {
    const { data: rawProducts, error } = await supabase
      .from("tenant_products")
      .select("*")
      .eq("tenant_id", tenantContext.tenantId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && rawProducts) {
      products = rawProducts as TenantProduct[];
    }
  } catch (err) {
    console.warn("[AdminProdutosPage] Falha ao consultar tenant_products:", err);
  }

  const slug = tenantContext.tenant?.slug || "meu-negocio";
  const phoneWhatsapp = profile?.phone_whatsapp || profile?.phone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Catálogo Físico & Peças</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Vitrine de Produtos & SEO Orgânico
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre produtos físicos, peças e acessórios para serem indexados no Google por buscas locais e recebidos diretamente no WhatsApp.
        </p>
      </div>

      {/* Gerenciador */}
      <ProductsManager
        initialProducts={products}
        slug={slug}
        phoneWhatsapp={phoneWhatsapp}
      />
    </div>
  );
}
