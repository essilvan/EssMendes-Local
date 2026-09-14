"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface CoverActionResponse {
  success: boolean;
  coverUrl?: string | null;
  error?: string;
}

/**
 * Garante que o bucket 'tenants' existe e está configurado publicamente no Supabase Storage.
 */
async function ensureTenantsBucketExists(adminClient: ReturnType<typeof createAdminClient>) {
  try {
    const { data: buckets } = await adminClient.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === "tenants");
    if (!exists) {
      await adminClient.storage.createBucket("tenants", {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
    }
  } catch (err) {
    console.warn("[ensureTenantsBucketExists] Aviso ao checar/criar bucket:", err);
  }
}

/**
 * 1. Upload de Foto de Capa diretamente do computador para o Supabase Storage
 */
export async function uploadTenantCoverAction(formData: FormData): Promise<CoverActionResponse> {
  try {
    // 1.1 Autenticação e isolamento multi-tenant
    const { data: tenantContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantContext) {
      return { success: false, error: authError || "Sessão inválida ou expirada. Faça login novamente." };
    }

    const requestedTenantId = formData.get("tenantId")?.toString().trim();
    const effectiveTenantId = requestedTenantId || tenantContext.tenantId;

    if (!effectiveTenantId) {
      return { success: false, error: "ID do estabelecimento não identificado." };
    }

    // Se o usuário não for superadmin, proíbe alterar dados de outro tenant
    if (!tenantContext.isSuperAdmin && tenantContext.tenantId !== effectiveTenantId) {
      return { success: false, error: "Você não tem permissão para alterar este estabelecimento." };
    }

    // 1.2 Validação do arquivo
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "Nenhum arquivo de imagem foi selecionado." };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Formato de arquivo inválido. Selecione uma imagem JPG, PNG ou WebP.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "Arquivo muito grande. O limite máximo permitido é 5MB.",
      };
    }

    // 1.3 Geração de caminho único no storage
    let extension = "jpg";
    if (file.type === "image/png") extension = "png";
    else if (file.type === "image/webp") extension = "webp";
    else if (file.name.includes(".")) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) {
        extension = ext === "jpeg" ? "jpg" : ext;
      }
    }

    const filePath = `covers/${effectiveTenantId}-${Date.now()}.${extension}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 1.4 Cliente Supabase Admin com Service Role
    const supabaseAdmin = createAdminClient();
    await ensureTenantsBucketExists(supabaseAdmin);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("tenants")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[uploadTenantCoverAction] Erro ao enviar imagem para o storage:", uploadError);
      return { success: false, error: `Falha no upload para o servidor: ${uploadError.message}` };
    }

    // 1.5 Obter URL pública do arquivo
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("tenants")
      .getPublicUrl(filePath);

    if (!publicUrl) {
      return { success: false, error: "Não foi possível gerar a URL pública da foto de capa." };
    }

    const now = new Date().toISOString();

    // 1.6 Persistir cover_image_url na tabela 'tenants'
    const { error: updateTenantError } = await supabaseAdmin
      .from("tenants")
      .update({
        cover_image_url: publicUrl,
        updated_at: now,
      })
      .eq("id", effectiveTenantId);

    if (updateTenantError) {
      console.error("[uploadTenantCoverAction] Erro ao salvar capa em 'tenants':", updateTenantError);
    }

    // 1.7 Persistir cover_image_url e hero_image_url na tabela 'tenant_profiles'
    const { error: updateProfileError } = await supabaseAdmin
      .from("tenant_profiles")
      .upsert(
        {
          tenant_id: effectiveTenantId,
          cover_image_url: publicUrl,
          hero_image_url: publicUrl,
          updated_at: now,
        },
        { onConflict: "tenant_id" }
      );

    if (updateProfileError) {
      console.error("[uploadTenantCoverAction] Erro ao salvar capa em 'tenant_profiles':", updateProfileError);
    }

    // 1.8 Revalidação de Cache
    revalidatePath("/[slug]", "page");
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/configuracoes");

    return {
      success: true,
      coverUrl: publicUrl,
    };
  } catch (err: any) {
    console.error("[uploadTenantCoverAction] Erro inesperado:", err);
    return { success: false, error: err.message || "Erro interno ao processar upload da foto de capa." };
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
    const { data: tenantContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantContext) {
      return { success: false, error: authError || "Sessão inválida ou expirada. Faça login novamente." };
    }

    const effectiveTenantId = tenantId || tenantContext.tenantId;
    if (!effectiveTenantId) {
      return { success: false, error: "ID do estabelecimento não identificado." };
    }

    if (!tenantContext.isSuperAdmin && tenantContext.tenantId !== effectiveTenantId) {
      return { success: false, error: "Você não tem permissão para alterar este estabelecimento." };
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
    const supabaseAdmin = createAdminClient();

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
    }

    // Atualiza tabela tenant_profiles
    const { error: updateProfileError } = await supabaseAdmin
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

    if (updateProfileError) {
      console.error("[updateTenantCoverUrlAction] Erro ao atualizar tenant_profiles:", updateProfileError);
    }

    // Revalidação de Cache
    revalidatePath("/[slug]", "page");
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/configuracoes");

    return {
      success: true,
      coverUrl: finalUrl,
    };
  } catch (err: any) {
    console.error("[updateTenantCoverUrlAction] Erro inesperado:", err);
    return { success: false, error: err.message || "Erro interno ao atualizar URL da capa." };
  }
}

/**
 * 3. Remoção da Foto de Capa (Restaura o fallback padrão ou imagem do Google)
 */
export async function removeTenantCoverAction(tenantId?: string): Promise<CoverActionResponse> {
  return updateTenantCoverUrlAction({ tenantId, coverUrl: "" });
}
