"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import type { TenantReview } from "@/types";

export interface ReviewActionState {
  success?: boolean;
  error?: string;
  message?: string;
  data?: TenantReview;
}

export async function addTenantReviewAction(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const authorName = formData.get("authorName")?.toString().trim() || "";
  const rating = Number(formData.get("rating")) || 5;
  const text = formData.get("text")?.toString().trim() || "";
  const relativeTime = formData.get("relativeTime")?.toString().trim() || "recentemente";

  if (!authorName) {
    return { error: "Informe o nome do cliente que fez a avaliação." };
  }

  if (!text) {
    return { error: "Informe o texto do depoimento / avaliação." };
  }

  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const tenantId = tenantContext.tenantId;
  const supabase = await createClient();

  try {
    const { data: insertedReview, error } = await supabase
      .from("tenant_reviews")
      .insert({
        tenant_id: tenantId,
        author_name: authorName,
        rating,
        text,
        relative_time: relativeTime,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[addTenantReviewAction] Erro no Supabase:", error);
      return { error: `Erro ao salvar avaliação: ${error.message}` };
    }

    // 1. Obter o slug do tenant de forma resiliente
    let tenantSlug = tenantContext.tenant?.slug;
    if (!tenantSlug) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", tenantId)
        .maybeSingle();
      tenantSlug = tenantData?.slug;
    }

    // 2. Revalidação de Cache imediata (Admin e Vitrine Pública)
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/dashboard");
    if (tenantSlug) {
      revalidatePath(`/${tenantSlug}`);
      revalidatePath(`/${tenantSlug}`, "page");
      revalidatePath(`/${tenantSlug}`, "layout");
    }
    revalidatePath("/[slug]", "page");
    revalidatePath("/[slug]", "layout");

    return {
      success: true,
      message: "Avaliação adicionada com sucesso!",
      data: insertedReview as TenantReview,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return { error: msg };
  }
}

export async function deleteTenantReviewAction(
  reviewId: string,
  authorName?: string
): Promise<ReviewActionState> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada." };
  }

  const tenantId = tenantContext.tenantId;
  const trimmedId = reviewId ? reviewId.trim() : "";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);

  const supabase = await createClient();

  try {
    let deletedCount = 0;
    let targetTenantId = tenantId;

    // 1. Tentar deletar por ID se for UUID válido
    if (isUuid) {
      // Localiza o registro antes para obter o tenant_id real
      const { data: reviewRow } = await supabase
        .from("tenant_reviews")
        .select("id, tenant_id, author_name")
        .eq("id", trimmedId)
        .maybeSingle();

      if (reviewRow?.tenant_id) {
        targetTenantId = reviewRow.tenant_id;
      }

      const deleteQuery = supabase
        .from("tenant_reviews")
        .delete({ count: "exact" })
        .eq("id", trimmedId);

      // Se não for super admin, restringe ao tenant autenticado
      if (!tenantContext.isSuperAdmin) {
        deleteQuery.eq("tenant_id", tenantId);
      }

      const { error: delError, count } = await deleteQuery;
      if (delError) {
        console.error("[deleteTenantReviewAction] Erro ao deletar do Supabase por ID:", delError);
        return { error: delError.message };
      }
      deletedCount = count ?? 0;
    }

    // 2. Se não deletou por ID (ex: id inválido/timestamp ou count === 0), executa fallback por author_name
    const targetAuthor = authorName || (!isUuid && trimmedId ? trimmedId : null);
    if (deletedCount === 0 && targetAuthor) {
      console.log(`[deleteTenantReviewAction] Executando fallback de exclusão por author_name: "${targetAuthor}"`);
      const authorDeleteQuery = supabase
        .from("tenant_reviews")
        .delete({ count: "exact" })
        .ilike("author_name", targetAuthor);

      if (!tenantContext.isSuperAdmin) {
        authorDeleteQuery.eq("tenant_id", tenantId);
      }

      const { error: authError, count: authCount } = await authorDeleteQuery;
      if (authError) {
        console.error("[deleteTenantReviewAction] Erro ao deletar do Supabase por autor:", authError);
      } else {
        deletedCount = authCount ?? 0;
      }
    }

    console.log(`[deleteTenantReviewAction] Concluído. Registros deletados do Supabase: ${deletedCount}`);

    // 3. Obter o slug do tenant de forma resiliente
    let tenantSlug = tenantContext.tenant?.slug;
    if (!tenantSlug || targetTenantId !== tenantId) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", targetTenantId)
        .maybeSingle();
      if (tenantData?.slug) {
        tenantSlug = tenantData.slug;
      }
    }

    // 4. Revalidação de Cache imediata (Admin e Vitrine Pública)
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/dashboard");

    if (tenantSlug) {
      revalidatePath(`/${tenantSlug}`);
      revalidatePath(`/${tenantSlug}`, "page");
      revalidatePath(`/${tenantSlug}`, "layout");
    }
    revalidatePath("/[slug]", "page");
    revalidatePath("/[slug]", "layout");

    return { success: true, message: "Avaliação removida com sucesso." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return { error: msg };
  }
}

export async function toggleTenantReviewVisibilityAction(
  reviewId: string,
  isVisible: boolean
): Promise<ReviewActionState> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada." };
  }

  const tenantId = tenantContext.tenantId;
  const trimmedId = reviewId ? reviewId.trim() : "";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);

  if (!isUuid) {
    return { error: "Identificador de avaliação inválido para atualização." };
  }

  const supabase = await createClient();

  try {
    // 1. Obter registro para capturar o tenant_id real
    const { data: reviewRow } = await supabase
      .from("tenant_reviews")
      .select("id, tenant_id")
      .eq("id", trimmedId)
      .maybeSingle();

    const targetTenantId = reviewRow?.tenant_id || tenantId;

    const updateQuery = supabase
      .from("tenant_reviews")
      .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
      .eq("id", trimmedId);

    if (!tenantContext.isSuperAdmin) {
      updateQuery.eq("tenant_id", targetTenantId);
    }

    const { error: updateError } = await updateQuery;
    if (updateError) {
      console.error("[toggleTenantReviewVisibilityAction] Erro no Supabase:", updateError);
      return { error: updateError.message };
    }

    // 2. Obter o slug do tenant de forma resiliente
    let tenantSlug = tenantContext.tenant?.slug;
    if (!tenantSlug || targetTenantId !== tenantId) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", targetTenantId)
        .maybeSingle();
      if (tenantData?.slug) {
        tenantSlug = tenantData.slug;
      }
    }

    // 3. Revalidação de Cache imediata (Admin e Vitrine Pública)
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/dashboard");

    if (tenantSlug) {
      revalidatePath(`/${tenantSlug}`);
      revalidatePath(`/${tenantSlug}`, "page");
      revalidatePath(`/${tenantSlug}`, "layout");
    }
    revalidatePath("/[slug]", "page");
    revalidatePath("/[slug]", "layout");

    return {
      success: true,
      message: isVisible
        ? "Avaliação agora está visível na vitrine pública!"
        : "Avaliação ocultada da vitrine pública com sucesso.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return { error: msg };
  }
}
