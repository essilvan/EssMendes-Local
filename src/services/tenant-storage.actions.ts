"use server";

import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import {
  uploadTenantStorageBuffer,
  saveTenantPhotoUrl,
  ESTABLISHMENT_PHOTOS_BUCKET,
} from "./tenant-storage.service";
import { revalidatePath } from "next/cache";

export interface TenantStorageActionResponse {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

/**
 * Server Action padronizada para upload multi-tenant isolado por tenant_id
 */
export async function uploadTenantPhotoAction(
  formData: FormData
): Promise<TenantStorageActionResponse> {
  try {
    const file = formData.get("file") as File | null;
    let tenantId = (formData.get("tenantId") as string | null)?.trim() || null;
    const photoType = (formData.get("photoType") as string | null)?.trim() || "photo";
    const targetColumn = (formData.get("targetColumn") as string | null)?.trim() || null;

    // Recupera tenant_id autenticado se não fornecido explicitamente
    const { data: tenantContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantContext) {
      if (!tenantId) {
        return { success: false, error: authError || "Sessão não autorizada." };
      }
    } else {
      // Se não for super admin, garante que o tenant_id é o do usuário autenticado
      if (!tenantContext.isSuperAdmin) {
        tenantId = tenantContext.tenantId;
      } else if (!tenantId) {
        tenantId = tenantContext.tenantId;
      }
    }

    if (!tenantId) {
      return { success: false, error: "ID do estabelecimento não identificado." };
    }

    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      return { success: false, error: "Nenhum arquivo enviado para upload." };
    }

    if (file.size === 0) {
      return { success: false, error: "O arquivo selecionado está vazio." };
    }

    // Limite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "A imagem deve ter no máximo 10MB." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadRes = await uploadTenantStorageBuffer({
      tenantId,
      buffer,
      photoType,
      contentType: file.type || "image/jpeg",
      bucket: ESTABLISHMENT_PHOTOS_BUCKET,
    });

    if (!uploadRes.success || !uploadRes.publicUrl) {
      return { success: false, error: uploadRes.error || "Erro no upload da foto." };
    }

    // Se especificada a coluna de destino, salva diretamente no banco de dados
    if (targetColumn) {
      const saveRes = await saveTenantPhotoUrl({
        tenantId,
        publicUrl: uploadRes.publicUrl,
        targetColumn,
        photoType,
      });

      if (!saveRes.success) {
        console.warn("[uploadTenantPhotoAction] Aviso ao salvar URL no banco:", saveRes.error);
      }
    }

    // Revalidação de Cache
    try {
      revalidatePath("/[slug]", "page");
      revalidatePath("/admin/perfil");
      revalidatePath("/admin/configuracoes");
    } catch {}

    return {
      success: true,
      publicUrl: uploadRes.publicUrl,
      filePath: uploadRes.filePath,
    };
  } catch (err: any) {
    console.error("[uploadTenantPhotoAction] Erro capturado:", err);
    return { success: false, error: err?.message || "Erro inesperado ao realizar upload." };
  }
}
