"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import { calculateLocalPresenceScore } from "@/services/presence-score.service";
import type { TenantOpportunity } from "@/types";

export interface RadarAlert {
  id: string;
  type: "critical" | "warning" | "success" | "info";
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}

/**
 * Retorna as oportunidades de crescimento do tenant (geradas dinamicamente com base nas métricas reais)
 */
export async function getTenantOpportunitiesAction(): Promise<{
  success: boolean;
  data?: TenantOpportunity[];
  error?: string;
}> {
  try {
    const { data: tenantContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantContext) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const tenantId = tenantContext.tenantId;
    const supabase = await createClient();

    // 1. Busca dados consolidados do tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, slug, google_rating, google_reviews_count")
      .eq("id", tenantId)
      .single();

    const { data: profile } = await supabase
      .from("tenant_profiles")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const { count: srvCount } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    let prodCount = 0;
    try {
      const { count: pCount } = await supabase
        .from("tenant_products")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_available", true);
      prodCount = pCount || 0;
    } catch {}

    const { count: postCount } = await supabase
      .from("tenant_posts")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    const { data: rawReviews } = await supabase
      .from("tenant_reviews")
      .select("id, rating, text, reply_text")
      .eq("tenant_id", tenantId);

    const { count: portCount } = await supabase
      .from("portfolio_items")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    const { opportunities } = calculateLocalPresenceScore({
      tenant: tenant || { id: tenantId, name: "Estabelecimento", slug: "slug" },
      profile,
      servicesCount: srvCount || 0,
      productsCount: prodCount,
      postsCount: postCount || 0,
      reviews: rawReviews || [],
      portfolioCount: portCount || 0,
    });

    const formattedOpportunities: TenantOpportunity[] = opportunities.map((op, idx) => ({
      id: `opp-${idx + 1}`,
      tenant_id: tenantId,
      title: op.title,
      description: op.description,
      priority: op.priority,
      impact: op.impact,
      action_label: op.action_label,
      action_url: op.action_url,
      category: op.category,
      status: op.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return { success: true, data: formattedOpportunities };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao carregar oportunidades";
    console.error("[getTenantOpportunitiesAction] Erro:", err);
    return { success: false, error: msg };
  }
}

/**
 * Radar de Saúde Digital: Gera alertas inteligentes em tempo real
 */
export async function getTenantRadarAlertsAction(): Promise<{
  success: boolean;
  data?: RadarAlert[];
  error?: string;
}> {
  try {
    const { data: tenantContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantContext) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const tenantId = tenantContext.tenantId;
    const supabase = await createClient();
    const alerts: RadarAlert[] = [];

    // 1. Checa avaliações sem resposta
    const { data: reviews } = await supabase
      .from("tenant_reviews")
      .select("id, reply_text, rating")
      .eq("tenant_id", tenantId);

    const unanswered = (reviews || []).filter((r) => !r.reply_text).length;
    if (unanswered > 0) {
      alerts.push({
        id: "alert-unanswered-reviews",
        type: unanswered >= 3 ? "critical" : "warning",
        title: `${unanswered} avaliações aguardando resposta`,
        description: "Responder aos seus clientes no Google aumenta sua taxa de conversão em até 35%.",
        actionLabel: "Responder com IA",
        actionUrl: "/admin/avaliacoes",
      });
    }

    // 2. Checa posts recentes
    const { data: latestPost } = await supabase
      .from("tenant_posts")
      .select("created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestPost) {
      alerts.push({
        id: "alert-no-posts",
        type: "warning",
        title: "Nenhuma publicação ativa de SEO Local",
        description: "Publique um artigo semanal com IA para manter o Google atento à sua região.",
        actionLabel: "Criar Post Semanal",
        actionUrl: "/admin/posts",
      });
    } else {
      const daysSinceLastPost = Math.floor(
        (Date.now() - new Date(latestPost.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPost >= 14) {
        alerts.push({
          id: "alert-outdated-posts",
          type: "warning",
          title: `${daysSinceLastPost} dias sem novas publicações`,
          description: "O algoritmo do Google premia perfis que atualizam novidades regularmente.",
          actionLabel: "Gerar Novo Post",
          actionUrl: "/admin/posts",
        });
      }
    }

    // 3. Checa vitrine de produtos
    let prodCount = 0;
    try {
      const { count } = await supabase
        .from("tenant_products")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_available", true);
      prodCount = count || 0;
    } catch {}

    if (prodCount === 0) {
      alerts.push({
        id: "alert-no-products",
        type: "info",
        title: "Vitrine de produtos desativada",
        description: "Adicione itens físicos ou peças para receber pedidos diretos no WhatsApp.",
        actionLabel: "Cadastrar Produtos",
        actionUrl: "/admin/produtos",
      });
    }

    // 4. Indicador positivo se tudo estiver excelente
    if (unanswered === 0 && (reviews || []).length > 0) {
      alerts.push({
        id: "alert-reviews-ok",
        type: "success",
        title: "Reputação 100% em dia!",
        description: "Todas as suas avaliações registradas foram respondidas com atenção.",
      });
    }

    return { success: true, data: alerts };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao carregar Radar de Saúde";
    return { success: false, error: msg };
  }
}
