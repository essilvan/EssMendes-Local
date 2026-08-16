"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export interface PortfolioActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * 1. Criação de item de Portfólio (Antes & Depois)
 */
export async function createPortfolioItemAction(
  _prevState: PortfolioActionState,
  formData: FormData
): Promise<PortfolioActionState> {
  const title = formData.get("title")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || "";
  const beforeImageUrl = formData.get("beforeImageUrl")?.toString().trim() || "";
  const afterImageUrl = formData.get("afterImageUrl")?.toString().trim() || "";
  const displayOrder = Number(formData.get("displayOrder")?.toString() || 0);
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!title) {
    return { error: "Informe o título do procedimento ou transformação." };
  }

  if (!beforeImageUrl || !afterImageUrl) {
    return { error: "Envie a foto do Antes e a foto do Depois para cadastrar a transformação." };
  }

  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: tenantError || "Estabelecimento não autenticado." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({
        tenant_id: tenantContext.tenantId,
        title,
        description: description || null,
        before_image_url: beforeImageUrl,
        after_image_url: afterImageUrl,
        display_order: displayOrder,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      console.error("[createPortfolioItemAction] Erro no Supabase:", error);
      return { error: `Erro ao salvar item no banco: ${error.message}` };
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/admin/dashboard");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return {
      success: true,
      message: `Transformação "${data.title}" cadastrada com sucesso!`,
    };
  } catch (err: any) {
    console.error("[createPortfolioItemAction] Exceção:", err);
    return { error: "Erro inesperado ao salvar item de portfólio." };
  }
}

/**
 * 2. Atualização de item de Portfólio
 */
export async function updatePortfolioItemAction(
  _prevState: PortfolioActionState,
  formData: FormData
): Promise<PortfolioActionState> {
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID do item não fornecido." };

  const title = formData.get("title")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || "";
  const beforeImageUrl = formData.get("beforeImageUrl")?.toString().trim() || "";
  const afterImageUrl = formData.get("afterImageUrl")?.toString().trim() || "";
  const displayOrder = Number(formData.get("displayOrder")?.toString() || 0);
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!title) return { error: "Informe o título do procedimento." };
  if (!beforeImageUrl || !afterImageUrl) return { error: "Envie as fotos de Antes e Depois." };

  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: tenantError || "Estabelecimento não autenticado." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .update({
        title,
        description: description || null,
        before_image_url: beforeImageUrl,
        after_image_url: afterImageUrl,
        display_order: displayOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantContext.tenantId)
      .select()
      .single();

    if (error) {
      console.error("[updatePortfolioItemAction] Erro no Supabase:", error);
      return { error: `Erro ao atualizar item: ${error.message}` };
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/admin/dashboard");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return {
      success: true,
      message: `Transformação "${data.title}" atualizada com sucesso!`,
    };
  } catch (err: any) {
    return { error: "Erro ao processar atualização." };
  }
}

/**
 * 3. Alternar status ativo/inativo
 */
export async function togglePortfolioStatusAction(
  itemId: string,
  currentStatus: boolean
): Promise<{ success?: boolean; error?: string }> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: tenantError || "Não autorizado." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("portfolio_items")
      .update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("tenant_id", tenantContext.tenantId);

    if (error) return { error: error.message };

    revalidatePath("/admin/portfolio");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    return { error: "Falha ao alterar status." };
  }
}

/**
 * 4. Exclusão de item de portfólio
 */
export async function deletePortfolioItemAction(
  itemId: string
): Promise<{ success?: boolean; error?: string }> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: tenantError || "Não autorizado." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", itemId)
      .eq("tenant_id", tenantContext.tenantId);

    if (error) return { error: error.message };

    revalidatePath("/admin/portfolio");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    return { error: "Falha ao excluir item." };
  }
}
