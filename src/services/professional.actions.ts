"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import {
  professionalSchema,
  type ProfessionalInput,
} from "@/lib/validations/professional.schema";
import type { TenantProfessional } from "@/types";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Lista profissionais ativos ou todos do tenant autenticado
 */
export async function getProfessionalsAction(
  onlyActive = false
): Promise<ActionResult<TenantProfessional[]>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    let query = supabase
      .from("tenant_professionals")
      .select("*")
      .eq("tenant_id", tenantCtx.tenantId)
      .order("name", { ascending: true });

    if (onlyActive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getProfessionalsAction] Erro no banco:", error);
      return { success: false, error: "Falha ao carregar profissionais." };
    }

    return { success: true, data: (data || []) as TenantProfessional[] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[getProfessionalsAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * Criação de um novo profissional vinculado ao tenant autenticado
 */
export async function createProfessionalAction(
  formData: ProfessionalInput
): Promise<ActionResult<TenantProfessional>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const validation = professionalSchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: "Dados do profissional inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const supabase = await createClient();
    const roleTitle =
      validation.data.role_title?.trim() ||
      validation.data.specialty?.trim() ||
      "Profissional";

    // 1. Inserir na tabela tenant_professionals
    const { data, error: dbError } = await supabase
      .from("tenant_professionals")
      .insert({
        tenant_id: tenantCtx.tenantId,
        name: validation.data.name.trim(),
        phone: validation.data.phone.trim(),
        role_title: roleTitle,
        avatar_url: validation.data.avatar_url?.trim() || null,
        is_active: validation.data.is_active ?? true,
      })
      .select()
      .single();

    if (dbError || !data) {
      console.error("[createProfessionalAction] Erro ao inserir:", dbError);
      return {
        success: false,
        error: dbError?.message || "Falha ao salvar profissional no banco de dados.",
      };
    }

    // 2. Sincronização espelho preventiva com a tabela 'professionals' (compatibilidade legada)
    try {
      await supabase.from("professionals").upsert({
        id: data.id,
        tenant_id: tenantCtx.tenantId,
        name: validation.data.name.trim(),
        role_title: roleTitle,
        avatar_url: validation.data.avatar_url?.trim() || null,
        is_active: validation.data.is_active ?? true,
      });
    } catch (syncErr) {
      console.warn("[createProfessionalAction] Aviso de espelhamento legada:", syncErr);
    }

    revalidatePath("/admin/profissionais");
    revalidatePath("/admin/agendamentos");
    revalidatePath("/[slug]", "page");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

    return { success: true, data: data as TenantProfessional };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[createProfessionalAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * Atualização de um profissional existente
 */
export async function updateProfessionalAction(
  id: string,
  formData: ProfessionalInput
): Promise<ActionResult<TenantProfessional>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const validation = professionalSchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: "Dados do profissional inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const supabase = await createClient();
    const roleTitle =
      validation.data.role_title?.trim() ||
      validation.data.specialty?.trim() ||
      "Profissional";

    // 1. Atualizar tenant_professionals
    const { data, error: dbError } = await supabase
      .from("tenant_professionals")
      .update({
        name: validation.data.name.trim(),
        phone: validation.data.phone.trim(),
        role_title: roleTitle,
        avatar_url: validation.data.avatar_url?.trim() || null,
        is_active: validation.data.is_active,
      })
      .eq("id", id)
      .eq("tenant_id", tenantCtx.tenantId)
      .select()
      .single();

    if (dbError || !data) {
      console.error("[updateProfessionalAction] Erro ao atualizar:", dbError);
      return { success: false, error: "Falha ao atualizar dados do profissional." };
    }

    // 2. Sincronização espelho com 'professionals'
    try {
      await supabase
        .from("professionals")
        .update({
          name: validation.data.name.trim(),
          role_title: roleTitle,
          avatar_url: validation.data.avatar_url?.trim() || null,
          is_active: validation.data.is_active,
        })
        .eq("id", id)
        .eq("tenant_id", tenantCtx.tenantId);
    } catch (syncErr) {
      console.warn("[updateProfessionalAction] Aviso de espelhamento legada:", syncErr);
    }

    revalidatePath("/admin/profissionais");
    revalidatePath("/admin/agendamentos");
    revalidatePath("/[slug]", "page");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

    return { success: true, data: data as TenantProfessional };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[updateProfessionalAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * Alternar status Ativo/Inativo do profissional
 */
export async function toggleProfessionalStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from("tenant_professionals")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("tenant_id", tenantCtx.tenantId);

    if (dbError) {
      console.error("[toggleProfessionalStatusAction] Erro:", dbError);
      return { success: false, error: "Falha ao alterar status do profissional." };
    }

    try {
      await supabase
        .from("professionals")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("tenant_id", tenantCtx.tenantId);
    } catch {}

    revalidatePath("/admin/profissionais");
    revalidatePath("/admin/agendamentos");
    revalidatePath("/[slug]", "page");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[toggleProfessionalStatusAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * Excluir profissional
 */
export async function deleteProfessionalAction(id: string): Promise<ActionResult> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from("tenant_professionals")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantCtx.tenantId);

    if (dbError) {
      console.error("[deleteProfessionalAction] Erro:", dbError);
      return { success: false, error: "Falha ao excluir profissional." };
    }

    try {
      await supabase
        .from("professionals")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantCtx.tenantId);
    } catch {}

    revalidatePath("/admin/profissionais");
    revalidatePath("/admin/agendamentos");
    revalidatePath("/[slug]", "page");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[deleteProfessionalAction] Exceção:", err);
    return { success: false, error: msg };
  }
}
