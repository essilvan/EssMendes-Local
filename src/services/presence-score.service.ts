import { createClient } from "@/lib/supabase/server";
import type { LocalScoreResult } from "@/types";
import {
  calculateLocalPresenceScore,
  type ScoreDataInputs,
} from "@/utils/presence-score-engine";

export { calculateLocalPresenceScore, type ScoreDataInputs };

/**
 * Consulta e consolida o Score de Presença do Tenant diretamente do Banco
 */
export async function getTenantLocalScore(tenantId: string): Promise<LocalScoreResult> {
  const supabase = await createClient();

  // 1. Busca Tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, google_rating, google_reviews_count")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  // 2. Busca Profile
  const { data: profile } = await supabase
    .from("tenant_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // 3. Contagem de Serviços
  const { count: srvCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // 4. Contagem de Produtos (com fallback resiliente se tabela for recente)
  let prodCount = 0;
  try {
    const { count: pCount } = await supabase
      .from("tenant_products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_available", true);
    prodCount = pCount || 0;
  } catch {}

  // 5. Contagem de Posts
  const { count: postCount } = await supabase
    .from("tenant_posts")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // 6. Avaliações
  const { data: rawReviews } = await supabase
    .from("tenant_reviews")
    .select("id, rating, text, reply_text")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // 7. Portfólio
  const { count: portCount } = await supabase
    .from("portfolio_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const calculated = calculateLocalPresenceScore({
    tenant,
    profile,
    servicesCount: srvCount || 0,
    productsCount: prodCount,
    postsCount: postCount || 0,
    reviews: rawReviews || [],
    portfolioCount: portCount || 0,
  });

  return calculated.scoreResult;
}
