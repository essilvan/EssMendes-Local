"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Usa createAdminClient para persistência com Service Role garantida sem bloqueio de RLS
  const db = createAdminClient();

  try {
    let delData: any[] | null = null;
    let delError: any = null;

    // 1. Tentar deletar por ID se for UUID válido com .select()
    if (isUuid) {
      const deleteQuery = db
        .from("tenant_reviews")
        .delete()
        .eq("id", trimmedId);

      // Se não for super admin, restringe ao tenant autenticado
      if (!tenantContext.isSuperAdmin) {
        deleteQuery.eq("tenant_id", tenantId);
      }

      const res = await deleteQuery.select();
      delData = res.data;
      delError = res.error;
    }

    // 2. Se não deletou por ID (ex: id inválido ou count 0) e author_name foi informado, executa fallback
    const targetAuthor = authorName || (!isUuid && trimmedId ? trimmedId : null);
    if ((!delData || delData.length === 0) && targetAuthor && !delError) {
      console.log(`[deleteTenantReviewAction] Executando fallback de exclusão por author_name: "${targetAuthor}"`);
      const authorDeleteQuery = db
        .from("tenant_reviews")
        .delete()
        .ilike("author_name", targetAuthor);

      if (!tenantContext.isSuperAdmin) {
        authorDeleteQuery.eq("tenant_id", tenantId);
      }

      const res = await authorDeleteQuery.select();
      if (res.error) {
        delError = res.error;
      } else {
        delData = res.data;
      }
    }

    if (delError) {
      console.error("[deleteTenantReviewAction] Erro no Supabase:", delError);
      return { error: `Erro ao excluir avaliação: ${delError.message}` };
    }

    // Verificação explícita: se nenhum registro foi deletado, dispara erro em vez de falso sucesso
    if (!delData || delData.length === 0) {
      console.warn("[deleteTenantReviewAction] Nenhuma avaliação deletada para o ID/autor:", { trimmedId, targetAuthor });
      return { error: "Avaliação não encontrada ou sem permissão para exclusão." };
    }

    // 3. Obter o slug do tenant de forma resiliente
    let tenantSlug = tenantContext.tenant?.slug;
    if (!tenantSlug) {
      const { data: tenantData } = await db
        .from("tenants")
        .select("slug")
        .eq("id", tenantId)
        .maybeSingle();
      tenantSlug = tenantData?.slug;
    }

    // 4. Revalidação de Cache imediata (Admin e Vitrine Pública)
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/perfil");
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
      message: "Avaliação removida com sucesso.",
      data: delData[0] as TenantReview,
    };
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

  // Usa createAdminClient para persistência com Service Role garantida sem bloqueio de RLS
  const db = createAdminClient();

  try {
    const updateQuery = db
      .from("tenant_reviews")
      .update({
        is_visible: isVisible,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trimmedId);

    if (!tenantContext.isSuperAdmin) {
      updateQuery.eq("tenant_id", tenantId);
    }

    const { data, error } = await updateQuery.select();

    if (error) {
      console.error("[toggleTenantReviewVisibilityAction] Erro no Supabase:", error);
      return { error: `Erro ao alterar visibilidade: ${error.message}` };
    }

    // Verificação explícita: se nenhum registro foi atualizado, dispara erro em vez de falso sucesso
    if (!data || data.length === 0) {
      console.warn("[toggleTenantReviewVisibilityAction] Nenhuma avaliação atualizada para o ID:", trimmedId);
      return { error: "Avaliação não encontrada ou sem permissão para alteração." };
    }

    // 2. Obter o slug do tenant de forma resiliente
    let tenantSlug = tenantContext.tenant?.slug;
    if (!tenantSlug) {
      const { data: tenantData } = await db
        .from("tenants")
        .select("slug")
        .eq("id", tenantId)
        .maybeSingle();
      tenantSlug = tenantData?.slug;
    }

    // 3. Revalidação de Cache imediata (Admin e Vitrine Pública)
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/perfil");
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
      data: data[0] as TenantReview,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return { error: msg };
  }
}
