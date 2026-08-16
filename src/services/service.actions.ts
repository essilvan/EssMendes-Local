"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { serviceSchema } from "@/lib/validations/service.schema";
import { validateServiceLimit } from "@/config/plans";
import { revalidatePath } from "next/cache";

export interface ServiceActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * 1. Criação de Serviço com Injeção Segura de tenant_id, RLS e Enforcing de Limites de Plano
 */
export async function createServiceAction(
  _prevState: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const rawData = {
    name: formData.get("name")?.toString().trim() || "",
    description: formData.get("description")?.toString().trim() || "",
    price: formData.get("price")?.toString().replace(",", ".") || 0,
    durationMinutes: formData.get("durationMinutes")?.toString() || 0,
    isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
  };

  // Validação Zod dos dados
  const validation = serviceSchema.safeParse(rawData);
  if (!validation.success) {
    const errorMsg = validation.error.issues[0]?.message || "Dados inválidos.";
    console.error("[createServiceAction] Erro de validação:", errorMsg, rawData);
    return { error: errorMsg };
  }

  // Obter tenant_id do usuário logado
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    console.error("[createServiceAction] Erro ao recuperar tenant do usuário:", tenantError);
    return { error: tenantError || "Nenhum estabelecimento associado a esta conta." };
  }

  const supabase = await createClient();

  // Enforcing de Limites de Plano
  const planTier = tenantContext.tenant?.plan_tier || "free";
  const { count: currentServicesCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantContext.tenantId);

  const limitCheck = validateServiceLimit(currentServicesCount || 0, planTier);
  if (!limitCheck.allowed) {
    return {
      error: `Limite de ${limitCheck.limit} serviços atingido no Plano Gratuito. Faça upgrade para o Plano Pro para cadastrar serviços ilimitados.`,
    };
  }

  const { name, description, price, durationMinutes, isActive } = validation.data;

  // Inserção com tenant_id garantido
  const { data, error } = await supabase
    .from("services")
    .insert({
      tenant_id: tenantContext.tenantId,
      name,
      description: description || null,
      price,
      duration_minutes: durationMinutes,
      is_active: isActive,
    })
    .select()
    .single();

  if (error) {
    console.error("[createServiceAction] Erro no Supabase ao inserir serviço:", error);
    return { error: `Erro ao cadastrar serviço no banco: ${error.message}` };
  }

  // Revalidação de cache das páginas afetadas
  revalidatePath("/admin/servicos");
  revalidatePath("/admin/dashboard");
  if (tenantContext.tenant?.slug) {
    revalidatePath(`/${tenantContext.tenant.slug}`);
  }

  return {
    success: true,
    message: `Serviço "${data.name}" cadastrado com sucesso!`,
  };
}

/**
 * 2. Atualização de Serviço com Validação de Propriedade por tenant_id
 */
export async function updateServiceAction(
  _prevState: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const id = formData.get("id")?.toString();
  if (!id) {
    return { error: "ID do serviço não fornecido." };
  }

  const rawData = {
    id,
    name: formData.get("name")?.toString().trim() || "",
    description: formData.get("description")?.toString().trim() || "",
    price: formData.get("price")?.toString().replace(",", ".") || 0,
    durationMinutes: formData.get("durationMinutes")?.toString() || 0,
    isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
  };

  const validation = serviceSchema.safeParse(rawData);
  if (!validation.success) {
    const errorMsg = validation.error.issues[0]?.message || "Dados inválidos.";
    console.error("[updateServiceAction] Erro de validação:", errorMsg, rawData);
    return { error: errorMsg };
  }

  // Obter tenant_id do usuário logado
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    console.error("[updateServiceAction] Erro ao recuperar tenant do usuário:", tenantError);
    return { error: tenantError || "Nenhum estabelecimento associado." };
  }

  const { name, description, price, durationMinutes, isActive } = validation.data;
  const supabase = await createClient();

  // Atualização restrita pelo ID do serviço E pelo tenant_id
  const { data, error } = await supabase
    .from("services")
    .update({
      name,
      description: description || null,
      price,
      duration_minutes: durationMinutes,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantContext.tenantId)
    .select()
    .single();

  if (error) {
    console.error("[updateServiceAction] Erro no Supabase ao atualizar serviço:", error);
    return { error: `Erro ao atualizar serviço no banco: ${error.message}` };
  }

  // Revalidação de cache
  revalidatePath("/admin/servicos");
  revalidatePath("/admin/dashboard");
  if (tenantContext.tenant?.slug) {
    revalidatePath(`/${tenantContext.tenant.slug}`);
  }

  return {
    success: true,
    message: `Serviço "${data.name}" atualizado com sucesso!`,
  };
}

/**
 * 3. Alternância Rápida de Status Ativo/Inativo
 */
export async function toggleServiceStatusAction(
  serviceId: string,
  currentStatus: boolean
): Promise<{ success?: boolean; error?: string }> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    console.error("[toggleServiceStatusAction] Usuário sem tenant:", tenantError);
    return { error: tenantError || "Estabelecimento não autenticado." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId)
    .eq("tenant_id", tenantContext.tenantId);

  if (error) {
    console.error("[toggleServiceStatusAction] Erro no Supabase:", error);
    return { error: `Erro ao alterar status: ${error.message}` };
  }

  revalidatePath("/admin/servicos");
  revalidatePath("/admin/dashboard");
  if (tenantContext.tenant?.slug) {
    revalidatePath(`/${tenantContext.tenant.slug}`);
  }

  return { success: true };
}

/**
 * 4. Exclusão de Serviço com Restrição por tenant_id
 */
export async function deleteServiceAction(
  serviceId: string
): Promise<{ success?: boolean; error?: string }> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    console.error("[deleteServiceAction] Usuário sem tenant:", tenantError);
    return { error: tenantError || "Estabelecimento não autenticado." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("tenant_id", tenantContext.tenantId);

  if (error) {
    console.error("[deleteServiceAction] Erro no Supabase ao excluir:", error);
    return { error: `Erro ao excluir serviço: ${error.message}` };
  }

  revalidatePath("/admin/servicos");
  revalidatePath("/admin/dashboard");
  if (tenantContext.tenant?.slug) {
    revalidatePath(`/${tenantContext.tenant.slug}`);
  }

  return { success: true };
}
