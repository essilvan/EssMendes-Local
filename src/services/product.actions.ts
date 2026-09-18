"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import { ProductSchema, type ProductInput } from "@/lib/validations/product.schema";
import type { TenantProduct } from "@/types";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Cria um novo produto para o tenant autenticado
 */
export async function createProductAction(
  input: ProductInput
): Promise<ActionResult<TenantProduct>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const validation = ProductSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Dados do produto inválidos",
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = await createClient();
    const payload: Record<string, any> = {
      tenant_id: tenantCtx.tenantId,
      name: validation.data.name,
      description: validation.data.description || null,
      category: validation.data.category || null,
      price: validation.data.price,
      promotional_price: validation.data.promotional_price || null,
      image_url: validation.data.image_url || null,
      stock_quantity: validation.data.stock_quantity ?? null,
      is_available: validation.data.is_available ?? true,
      is_featured: validation.data.is_featured ?? false,
      display_order: validation.data.display_order ?? 0,
      updated_at: new Date().toISOString(),
    };

    let { data, error: dbError } = await supabase
      .from("tenant_products")
      .insert(payload)
      .select()
      .maybeSingle();

    // Fallback resiliente se a coluna stock_quantity ainda não tiver sido criada no DB remoto
    if (dbError && dbError.code === "42703") {
      console.warn("[createProductAction] Coluna stock_quantity não encontrada. Tentando inserção sem a coluna...");
      delete payload.stock_quantity;
      const retry = await supabase
        .from("tenant_products")
        .insert(payload)
        .select()
        .maybeSingle();
      data = retry.data;
      dbError = retry.error;
    }

    if (dbError) {
      console.error("[createProductAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao cadastrar produto no banco de dados." };
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/admin/dashboard");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
      revalidatePath(`/${tenantCtx.tenant.slug}`, "page");
    }
    revalidatePath("/[slug]", "page");

    return { success: true, data: data as TenantProduct };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao criar produto.";
    return { success: false, error: msg };
  }
}

/**
 * Atualiza um produto existente
 */
export async function updateProductAction(
  productId: string,
  input: ProductInput
): Promise<ActionResult<TenantProduct>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const validation = ProductSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Dados do produto inválidos",
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = await createClient();
    const updatePayload: Record<string, any> = {
      name: validation.data.name,
      description: validation.data.description || null,
      category: validation.data.category || null,
      price: validation.data.price,
      promotional_price: validation.data.promotional_price || null,
      image_url: validation.data.image_url || null,
      stock_quantity: validation.data.stock_quantity ?? null,
      is_available: validation.data.is_available,
      is_featured: validation.data.is_featured,
      display_order: validation.data.display_order,
      updated_at: new Date().toISOString(),
    };

    let { data, error: dbError } = await supabase
      .from("tenant_products")
      .update(updatePayload)
      .eq("id", productId)
      .eq("tenant_id", tenantCtx.tenantId)
      .select()
      .maybeSingle();

    // Fallback resiliente se a coluna stock_quantity ainda não tiver sido criada no DB remoto
    if (dbError && dbError.code === "42703") {
      console.warn("[updateProductAction] Coluna stock_quantity não encontrada. Tentando atualização sem a coluna...");
      delete updatePayload.stock_quantity;
      const retry = await supabase
        .from("tenant_products")
        .update(updatePayload)
        .eq("id", productId)
        .eq("tenant_id", tenantCtx.tenantId)
        .select()
        .maybeSingle();
      data = retry.data;
      dbError = retry.error;
    }

    if (dbError) {
      console.error("[updateProductAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao atualizar produto." };
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/admin/dashboard");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
      revalidatePath(`/${tenantCtx.tenant.slug}`, "page");
    }
    revalidatePath("/[slug]", "page");

    return { success: true, data: data as TenantProduct };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao atualizar produto.";
    return { success: false, error: msg };
  }
}

/**
 * Alterna a disponibilidade do produto (ativo / inativo)
 */
export async function toggleProductAvailabilityAction(
  productId: string,
  currentStatus: boolean
): Promise<ActionResult> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("tenant_products")
      .update({
        is_available: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("tenant_id", tenantCtx.tenantId);

    if (dbError) {
      return { success: false, error: "Falha ao alterar disponibilidade do produto." };
    }

    revalidatePath("/admin/produtos");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    return { success: false, error: msg };
  }
}

/**
 * Remove um produto
 */
export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("tenant_products")
      .delete()
      .eq("id", productId)
      .eq("tenant_id", tenantCtx.tenantId);

    if (dbError) {
      console.error("[deleteProductAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao excluir produto." };
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/admin/dashboard");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao excluir produto.";
    return { success: false, error: msg };
  }
}

/**
 * Atualiza rapidamente a quantidade de estoque de um produto (com edição inline e botões +/-)
 */
export async function updateProductStockAction(
  productId: string,
  stockQuantity: number | null
): Promise<ActionResult<{ id: string; stock_quantity: number | null }>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    if (stockQuantity !== null && (isNaN(stockQuantity) || stockQuantity < 0)) {
      return { success: false, error: "Quantidade em estoque inválida." };
    }

    const cleanStock = stockQuantity !== null ? Math.floor(stockQuantity) : null;
    const supabase = await createClient();

    const { data, error: dbError } = await supabase
      .from("tenant_products")
      .update({
        stock_quantity: cleanStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("tenant_id", tenantCtx.tenantId)
      .select("id, stock_quantity")
      .maybeSingle();

    if (dbError) {
      console.error("[updateProductStockAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao atualizar estoque no banco de dados." };
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/admin/dashboard");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
      revalidatePath(`/${tenantCtx.tenant.slug}`, "page");
    }
    revalidatePath("/[slug]", "page");

    return {
      success: true,
      data: {
        id: productId,
        stock_quantity: cleanStock,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao atualizar estoque.";
    return { success: false, error: msg };
  }
}
