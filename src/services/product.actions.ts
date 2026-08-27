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
    const payload = {
      tenant_id: tenantCtx.tenantId,
      name: validation.data.name,
      description: validation.data.description || null,
      category: validation.data.category || null,
      price: validation.data.price,
      promotional_price: validation.data.promotional_price || null,
      image_url: validation.data.image_url || null,
      is_available: validation.data.is_available ?? true,
      is_featured: validation.data.is_featured ?? false,
      display_order: validation.data.display_order ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error: dbError } = await supabase
      .from("tenant_products")
      .insert(payload)
      .select()
      .single();

    if (dbError) {
      console.error("[createProductAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao cadastrar produto no banco de dados." };
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/admin/dashboard");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

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
    const { data, error: dbError } = await supabase
      .from("tenant_products")
      .update({
        name: validation.data.name,
        description: validation.data.description || null,
        category: validation.data.category || null,
        price: validation.data.price,
        promotional_price: validation.data.promotional_price || null,
        image_url: validation.data.image_url || null,
        is_available: validation.data.is_available,
        is_featured: validation.data.is_featured,
        display_order: validation.data.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("tenant_id", tenantCtx.tenantId)
      .select()
      .single();

    if (dbError) {
      console.error("[updateProductAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao atualizar produto." };
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/admin/dashboard");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

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
