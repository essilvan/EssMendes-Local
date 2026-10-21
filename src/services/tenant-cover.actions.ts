"use server";

import { createClient } from "@supabase/supabase-js";

export interface CoverActionResponse {
  success: boolean;
  coverUrl?: string | null;
  error?: string;
}

/**
 * Retorna o cliente Supabase com chave administrativa (Service Role) ou Anon de forma segura,
 * sem lançar exceções não tratadas (throw new Error).
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    console.error(
      "[getSupabaseAdmin] Configurações do Supabase ausentes no servidor (URL ou SERVICE_ROLE_KEY)."
    );
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * 1. Upload da Foto de Capa diretamente para o Supabase Storage com Buffer em Node.js
 */
export async function uploadTenantCoverAction(formData: FormData): Promise<CoverActionResponse> {
  try {
    const file = formData.get("file") as File | null;
    let tenantId = (formData.get("tenantId") as string | null)?.trim() || null;

    // Se o tenantId não veio explícito no formData, tenta recuperar via sessão autenticada defensivamente
    if (!tenantId) {
      try {
        const { getAuthenticatedTenant } = await import("@/lib/supabase/tenant");
        const { data: tenantContext } = await getAuthenticatedTenant();
        if (tenantContext?.tenantId) {
          tenantId = tenantContext.tenantId;
        }
      } catch (authErr) {
        console.warn("[uploadTenantCoverAction] Falha defensiva ao recuperar tenant via sessão:", authErr);
      }
    }

    if (!file || typeof file !== "object" || !("arrayBuffer" in file) || !tenantId) {
      return { success: false, error: "Arquivo ou ID da loja não fornecido." };
    }

    if (file.size === 0) {
      return { success: false, error: "O arquivo selecionado está vazio." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "A foto deve ter no máximo 5MB." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { uploadTenantStorageBuffer, ESTABLISHMENT_PHOTOS_BUCKET } = await import(
      "@/services/tenant-storage.service"
    );

    const uploadRes = await uploadTenantStorageBuffer({
      tenantId,
      buffer,
      photoType: "cover",
      contentType: file.type || "image/jpeg",
      bucket: ESTABLISHMENT_PHOTOS_BUCKET,
    });

    if (!uploadRes.success || !uploadRes.publicUrl) {
      return { success: false, error: uploadRes.error || "Erro no upload da foto de capa." };
    }

    const publicUrl = uploadRes.publicUrl;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Configurações do Supabase ausentes no servidor (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY).",
      };
    }

    const now = new Date().toISOString();

    // 3. Gravar na coluna cover_image_url da tabela 'tenants'
    const { error: dbError } = await supabaseAdmin
      .from("tenants")
      .update({
        cover_image_url: publicUrl,
        updated_at: now,
      })
      .eq("id", tenantId);

    if (dbError) {
      console.error("[uploadTenantCoverAction] Erro banco:", dbError);
      return { success: false, error: `Erro ao salvar no banco: ${dbError.message}` };
    }

    // 4. Sincronizar defensivamente também na tabela 'tenant_profiles'
    try {
      await supabaseAdmin
        .from("tenant_profiles")
        .upsert(
          {
            tenant_id: tenantId,
            cover_image_url: publicUrl,
            hero_image_url: publicUrl,
            updated_at: now,
          },
          { onConflict: "tenant_id" }
        );
    } catch (profileErr) {
      console.warn("[uploadTenantCoverAction] Aviso ao atualizar tenant_profiles:", profileErr);
    }

    // 5. Revalidação de Cache segura
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/[slug]", "page");
      revalidatePath("/admin/perfil");
      revalidatePath("/admin/configuracoes");
    } catch (revalErr) {
      console.warn("[uploadTenantCoverAction] Aviso ao revalidar caminhos de cache:", revalErr);
    }

    return { success: true, coverUrl: publicUrl };
  } catch (err: any) {
    console.error("[uploadTenantCoverAction] Crash capturado na action:", err);
    return { success: false, error: err?.message || "Erro inesperado no servidor ao processar upload." };
  }
}

/**
 * 2. Atualização manual da URL da Foto de Capa (por link direto)
 */
export async function updateTenantCoverUrlAction({
  tenantId,
  coverUrl,
}: {
  tenantId?: string;
  coverUrl: string;
}): Promise<CoverActionResponse> {
  try {
    let effectiveTenantId = tenantId?.trim() || null;

    if (!effectiveTenantId) {
      try {
        const { getAuthenticatedTenant } = await import("@/lib/supabase/tenant");
        const { data: tenantContext } = await getAuthenticatedTenant();
        if (tenantContext?.tenantId) {
          effectiveTenantId = tenantContext.tenantId;
        }
      } catch (authErr) {
        console.warn("[updateTenantCoverUrlAction] Erro auth:", authErr);
      }
    }

    if (!effectiveTenantId) {
      return { success: false, error: "ID do estabelecimento não identificado." };
    }

    const trimmedUrl = coverUrl ? coverUrl.trim() : "";
    if (trimmedUrl && !trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return {
        success: false,
        error: "URL inválida. O link deve começar com http:// ou https://",
      };
    }

    const finalUrl = trimmedUrl || null;
    const now = new Date().toISOString();

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return { success: false, error: "Configurações do Supabase ausentes no servidor." };
    }

    // Atualiza tabela tenants
    const { error: updateTenantError } = await supabaseAdmin
      .from("tenants")
      .update({
        cover_image_url: finalUrl,
        updated_at: now,
      })
      .eq("id", effectiveTenantId);

    if (updateTenantError) {
      console.error("[updateTenantCoverUrlAction] Erro ao atualizar tenants:", updateTenantError);
      return { success: false, error: `Erro ao salvar no banco: ${updateTenantError.message}` };
    }

    // Atualiza tabela tenant_profiles
    try {
      await supabaseAdmin
        .from("tenant_profiles")
        .upsert(
          {
            tenant_id: effectiveTenantId,
            cover_image_url: finalUrl,
            hero_image_url: finalUrl,
            updated_at: now,
          },
          { onConflict: "tenant_id" }
        );
    } catch (profileErr) {
      console.warn("[updateTenantCoverUrlAction] Erro ao atualizar tenant_profiles:", profileErr);
    }

    // Revalidação de Cache
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/[slug]", "page");
      revalidatePath("/admin/perfil");
      revalidatePath("/admin/configuracoes");
    } catch (revalErr) {
      console.warn("[updateTenantCoverUrlAction] Erro ao revalidar caminhos de cache:", revalErr);
    }

    return {
      success: true,
      coverUrl: finalUrl,
    };
  } catch (err: any) {
    console.error("[updateTenantCoverUrlAction] Erro inesperado:", err);
    return { success: false, error: err?.message || "Erro interno ao atualizar URL da capa." };
  }
}

/**
 * 3. Remoção da Foto de Capa (Restaura o fallback padrão ou imagem do Google)
 */
export async function removeTenantCoverAction(tenantId?: string): Promise<CoverActionResponse> {
  return updateTenantCoverUrlAction({ tenantId, coverUrl: "" });
}
