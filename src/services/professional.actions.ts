"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

interface QuoteRoutingPref {
  receives_quotes: boolean;
  is_primary_quote_contact: boolean;
}

/**
 * Mescla as colunas nativas de tenant_professionals com o fallback em tenants.theme_settings
 */
function enrichProfessionalsWithQuoteRouting(
  rawList: any[],
  themeSettings?: Record<string, any> | null
): TenantProfessional[] {
  const routingMap: Record<string, QuoteRoutingPref> =
    themeSettings?.quote_routing_professionals || {};

  return (rawList || []).map((p: any) => {
    const fallback = routingMap[p.id];
    const receivesQuotes =
      typeof p.receives_quotes === "boolean"
        ? p.receives_quotes
        : typeof fallback?.receives_quotes === "boolean"
        ? fallback.receives_quotes
        : true;
    const isPrimary =
      typeof p.is_primary_quote_contact === "boolean"
        ? p.is_primary_quote_contact
        : typeof fallback?.is_primary_quote_contact === "boolean"
        ? fallback.is_primary_quote_contact
        : false;

    return {
      id: p.id,
      tenant_id: p.tenant_id,
      name: p.name,
      phone: p.phone,
      role_title: p.role_title || p.specialty || "Profissional",
      specialty: p.role_title || p.specialty || "Profissional",
      avatar_url: p.avatar_url || null,
      is_active: p.is_active ?? true,
      receives_quotes: receivesQuotes,
      is_primary_quote_contact: isPrimary,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  });
}

/**
 * Sincroniza as flags de recebimento de orçamentos em tenants.theme_settings
 * garantindo funcionamento imediato mesmo antes de rodar migração SQL manual
 */
async function syncQuoteRoutingToTenantSettings(
  tenantId: string,
  profId: string,
  receivesQuotes: boolean,
  isPrimaryQuoteContact: boolean
) {
  try {
    const adminClient = createAdminClient();
    const { data: tenantRow } = await adminClient
      .from("tenants")
      .select("theme_settings")
      .eq("id", tenantId)
      .maybeSingle();

    const currentSettings =
      tenantRow?.theme_settings && typeof tenantRow.theme_settings === "object"
        ? { ...(tenantRow.theme_settings as Record<string, any>) }
        : {};

    const currentMap: Record<string, QuoteRoutingPref> =
      currentSettings.quote_routing_professionals &&
      typeof currentSettings.quote_routing_professionals === "object"
        ? { ...currentSettings.quote_routing_professionals }
        : {};

    if (isPrimaryQuoteContact) {
      for (const existingId of Object.keys(currentMap)) {
        currentMap[existingId] = {
          ...currentMap[existingId],
          is_primary_quote_contact: false,
        };
      }
    }

    currentMap[profId] = {
      receives_quotes: isPrimaryQuoteContact ? true : receivesQuotes,
      is_primary_quote_contact: isPrimaryQuoteContact,
    };

    await adminClient
      .from("tenants")
      .update({
        theme_settings: {
          ...currentSettings,
          quote_routing_professionals: currentMap,
        },
      })
      .eq("id", tenantId);
  } catch (err) {
    console.warn("[syncQuoteRoutingToTenantSettings] Aviso:", err);
  }
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

    const [profRes, tenantRes] = await Promise.all([
      query,
      supabase
        .from("tenants")
        .select("theme_settings")
        .eq("id", tenantCtx.tenantId)
        .maybeSingle(),
    ]);

    if (profRes.error) {
      console.error("[getProfessionalsAction] Erro no banco:", profRes.error);
      return { success: false, error: "Falha ao carregar profissionais." };
    }

    const enriched = enrichProfessionalsWithQuoteRouting(
      profRes.data || [],
      tenantRes.data?.theme_settings as Record<string, any> | null
    );

    return { success: true, data: enriched };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[getProfessionalsAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * Lista profissionais ativos da vitrine pública de um tenant
 */
export async function getPublicProfessionalsAction(
  tenantId: string
): Promise<ActionResult<TenantProfessional[]>> {
  try {
    if (!tenantId) {
      return { success: false, error: "Tenant ID é obrigatório." };
    }

    const supabase = await createClient();
    const [profRes, tenantRes] = await Promise.all([
      supabase
        .from("tenant_professionals")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("tenants")
        .select("theme_settings")
        .eq("id", tenantId)
        .maybeSingle(),
    ]);

    if (profRes.error) {
      console.error("[getPublicProfessionalsAction] Erro no banco:", profRes.error);
      return { success: false, error: "Falha ao carregar profissionais." };
    }

    const professionals = enrichProfessionalsWithQuoteRouting(
      profRes.data || [],
      tenantRes.data?.theme_settings as Record<string, any> | null
    );

    return { success: true, data: professionals };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[getPublicProfessionalsAction] Exceção:", err);
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
        error:
          validation.error.issues[0]?.message ||
          "Dados do profissional inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();
    const roleTitle =
      validation.data.role_title?.trim() ||
      validation.data.specialty?.trim() ||
      "Profissional";

    const isPrimaryQuoteContact = Boolean(validation.data.is_primary_quote_contact);
    const receivesQuotes = isPrimaryQuoteContact
      ? true
      : validation.data.receives_quotes ?? true;
    const cleanPhone = validation.data.phone.replace(/\D/g, "");
    const cleanAccessPin = validation.data.access_pin?.trim() || null;

    // Se marcado como principal, desmarca os demais profissionais do tenant (se a coluna já existir)
    if (isPrimaryQuoteContact) {
      try {
        await adminClient
          .from("tenant_professionals")
          .update({ is_primary_quote_contact: false })
          .eq("tenant_id", tenantCtx.tenantId);
      } catch {
        // Ignora caso a coluna ainda não tenha sido aplicada na instância remota
      }
    }

    const basePayload = {
      tenant_id: tenantCtx.tenantId,
      name: validation.data.name.trim(),
      phone: cleanPhone,
      role_title: roleTitle,
      avatar_url: validation.data.avatar_url?.trim() || null,
      is_active: validation.data.is_active ?? true,
    };

    // 1. Tenta inserir com as colunas receives_quotes e is_primary_quote_contact
    let { data, error: dbError } = await supabase
      .from("tenant_professionals")
      .insert({
        ...basePayload,
        receives_quotes: receivesQuotes,
        is_primary_quote_contact: isPrimaryQuoteContact,
      })
      .select()
      .single();

    // Fallback resiliente caso as colunas ainda não existam fisicamente no banco remoto
    if (dbError) {
      const retryRes = await supabase
        .from("tenant_professionals")
        .insert(basePayload)
        .select()
        .single();
      data = retryRes.data;
      dbError = retryRes.error;
    }

    if (dbError || !data) {
      console.error("[createProfessionalAction] Erro ao inserir:", dbError);
      return {
        success: false,
        error:
          dbError?.message || "Falha ao salvar profissional no banco de dados.",
      };
    }

    // 2. Sincroniza as preferências de roteamento de orçamentos no tenant
    await syncQuoteRoutingToTenantSettings(
      tenantCtx.tenantId,
      data.id,
      receivesQuotes,
      isPrimaryQuoteContact
    );

    // 3. Sincronização espelho preventiva com a tabela 'professionals' (compatibilidade legada e access_pin)
    try {
      await adminClient.from("professionals").upsert({
        id: data.id,
        tenant_id: tenantCtx.tenantId,
        name: validation.data.name.trim(),
        role_title: roleTitle,
        avatar_url: validation.data.avatar_url?.trim() || null,
        is_active: validation.data.is_active ?? true,
        access_pin: cleanAccessPin,
      });
    } catch (syncErr) {
      console.warn(
        "[createProfessionalAction] Aviso de espelhamento legada:",
        syncErr
      );
    }

    revalidatePath("/admin/profissionais");
    revalidatePath("/admin/equipe");
    revalidatePath("/admin/agendamentos");
    revalidatePath("/admin/orcamentos");
    revalidatePath("/[slug]", "page");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
      revalidatePath(`/${tenantCtx.tenant.slug}/garcom`);
    }

    const resultProf: TenantProfessional = {
      ...(data as TenantProfessional),
      role_title: data.role_title || roleTitle,
      specialty: data.role_title || roleTitle,
      access_pin: cleanAccessPin,
      receives_quotes: receivesQuotes,
      is_primary_quote_contact: isPrimaryQuoteContact,
    };

    return { success: true, data: resultProf };
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
        error:
          validation.error.issues[0]?.message ||
          "Dados do profissional inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();
    const roleTitle =
      validation.data.role_title?.trim() ||
      validation.data.specialty?.trim() ||
      "Profissional";

    const isPrimaryQuoteContact = Boolean(validation.data.is_primary_quote_contact);
    const receivesQuotes = isPrimaryQuoteContact
      ? true
      : validation.data.receives_quotes ?? true;
    const cleanPhone = validation.data.phone.replace(/\D/g, "");
    const cleanAccessPin = validation.data.access_pin?.trim() || null;

    // Se marcado como contato principal de orçamentos, desmarca os outros profissionais do tenant
    if (isPrimaryQuoteContact) {
      try {
        await adminClient
          .from("tenant_professionals")
          .update({ is_primary_quote_contact: false })
          .eq("tenant_id", tenantCtx.tenantId)
          .neq("id", id);
      } catch {
        // Ignora caso a coluna ainda não tenha sido aplicada na instância remota
      }
    }

    const baseUpdate = {
      name: validation.data.name.trim(),
      phone: cleanPhone,
      role_title: roleTitle,
      avatar_url: validation.data.avatar_url?.trim() || null,
      is_active: validation.data.is_active,
    };

    // 1. Atualizar tenant_professionals (com fallback caso as novas colunas ainda não estejam no schema cache)
    let { data, error: dbError } = await supabase
      .from("tenant_professionals")
      .update({
        ...baseUpdate,
        receives_quotes: receivesQuotes,
        is_primary_quote_contact: isPrimaryQuoteContact,
      })
      .eq("id", id)
      .eq("tenant_id", tenantCtx.tenantId)
      .select()
      .single();

    if (dbError) {
      const retryRes = await supabase
        .from("tenant_professionals")
        .update(baseUpdate)
        .eq("id", id)
        .eq("tenant_id", tenantCtx.tenantId)
        .select()
        .single();
      data = retryRes.data;
      dbError = retryRes.error;
    }

    if (dbError || !data) {
      console.error("[updateProfessionalAction] Erro ao atualizar:", dbError);
      return {
        success: false,
        error: "Falha ao atualizar dados do profissional.",
      };
    }

    // 2. Sincroniza as preferências de roteamento de orçamentos no tenant
    await syncQuoteRoutingToTenantSettings(
      tenantCtx.tenantId,
      id,
      receivesQuotes,
      isPrimaryQuoteContact
    );

    // 3. Sincronização espelho com 'professionals' (inclui access_pin)
    try {
      await adminClient.from("professionals").upsert({
        id: id,
        tenant_id: tenantCtx.tenantId,
        name: validation.data.name.trim(),
        role_title: roleTitle,
        avatar_url: validation.data.avatar_url?.trim() || null,
        is_active: validation.data.is_active,
        access_pin: cleanAccessPin,
      });
    } catch (syncErr) {
      console.warn(
        "[updateProfessionalAction] Aviso de espelhamento legada:",
        syncErr
      );
    }

    revalidatePath("/admin/profissionais");
    revalidatePath("/admin/equipe");
    revalidatePath("/admin/agendamentos");
    revalidatePath("/admin/orcamentos");
    revalidatePath("/[slug]", "page");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
      revalidatePath(`/${tenantCtx.tenant.slug}/garcom`);
    }

    const resultProf: TenantProfessional = {
      ...(data as TenantProfessional),
      role_title: data.role_title || roleTitle,
      specialty: data.role_title || roleTitle,
      access_pin: cleanAccessPin,
      receives_quotes: receivesQuotes,
      is_primary_quote_contact: isPrimaryQuoteContact,
    };

    return { success: true, data: resultProf };
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
      return {
        success: false,
        error: "Falha ao alterar status do profissional.",
      };
    }

    try {
      await supabase
        .from("professionals")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("tenant_id", tenantCtx.tenantId);
    } catch {}

    revalidatePath("/admin/profissionais");
    revalidatePath("/admin/equipe");
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
export async function deleteProfessionalAction(
  id: string
): Promise<ActionResult> {
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
    revalidatePath("/admin/equipe");
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

/**
 * Upload seguro de avatar do profissional para o bucket 'tenant-media' na pasta 'professionals/'
 */
export async function uploadProfessionalAvatarAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "Nenhum arquivo enviado." };
    }

    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "O arquivo deve ser uma imagem válida (JPG, PNG, WebP).",
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "A imagem deve ter no máximo 5MB." };
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `professionals/${tenantCtx.tenantId}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from("tenant-media")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(
        "[uploadProfessionalAvatarAction] Erro no storage:",
        uploadError
      );
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = adminClient.storage
      .from("tenant-media")
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error("[uploadProfessionalAvatarAction] Exceção:", err);
    return { success: false, error: err.message || "Falha ao enviar imagem." };
  }
}
