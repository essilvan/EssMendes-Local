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
  reviewId: string
): Promise<ReviewActionState> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada." };
  }

  const tenantId = tenantContext.tenantId;

  // Validação segura do formato UUID para evitar erro de sintaxe no Postgres (invalid input syntax for type uuid)
  const trimmedId = reviewId ? reviewId.trim() : "";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);

  if (!isUuid) {
    console.warn(`[deleteTenantReviewAction] reviewId inválido recebido: "${trimmedId}". Ignorando exclusão no banco.`);
    return { success: true, message: "Avaliação removida com sucesso." };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("tenant_reviews")
      .delete()
      .eq("id", trimmedId)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[deleteTenantReviewAction] Erro no Supabase:", error);
      return { error: error.message };
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

    return { success: true, message: "Avaliação removida com sucesso." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return { error: msg };
  }
}
