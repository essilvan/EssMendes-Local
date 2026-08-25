"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import type { TenantReview } from "@/types";

export interface ReviewActionState {
  success?: boolean;
  error?: string;
  message?: string;
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
    const { error } = await supabase.from("tenant_reviews").insert({
      tenant_id: tenantId,
      author_name: authorName,
      rating,
      text,
      relative_time: relativeTime,
    });

    if (error) {
      console.error("[addTenantReviewAction] Erro no Supabase:", error);
      return { error: `Erro ao salvar avaliação: ${error.message}` };
    }

    revalidatePath("/admin/perfil");
    revalidatePath("/admin/avaliacoes");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return {
      success: true,
      message: "Avaliação adicionada com sucesso!",
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
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("tenant_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("tenant_id", tenantId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin/perfil");
    revalidatePath("/admin/avaliacoes");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return { success: true, message: "Avaliação removida com sucesso." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return { error: msg };
  }
}
