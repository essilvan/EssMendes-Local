import { createAdminClient } from "@/lib/supabase/admin";
import { getNicheFallbackImage } from "@/utils/establishment-photos";
import { revalidatePath } from "next/cache";

export const ESTABLISHMENT_PHOTOS_BUCKET = "establishment-photos";
export const FALLBACK_STORAGE_BUCKET = "tenants";

/**
 * Gera o caminho de armazenamento estritamente padronizado por tenant:
 * ${tenant.id}/${photoType || 'photo'}-${Date.now()}-${randomHash}.jpg
 */
export function generateTenantStoragePath(tenantId: string, photoType?: string): string {
  const cleanTenantId = (tenantId || "default").trim();
  const safeType = (photoType || "photo")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_");
  const randomHash = Math.random().toString(36).substring(2, 8);
  return `${cleanTenantId}/${safeType}-${Date.now()}-${randomHash}.jpg`;
}

/**
 * Detecta se uma URL pertence à infraestrutura de fotos do Google
 */
export function isGooglePhotoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("googleusercontent.com") ||
    lower.includes("googleapis.com") ||
    lower.includes("ggpht.com") ||
    lower.includes("google.com/maps")
  );
}

/**
 * Garante que o bucket de fotos do estabelecimento existe no Supabase Storage
 */
async function ensureBucketExists(supabase: ReturnType<typeof createAdminClient>, bucketName: string) {
  try {
    const { data: bucket, error: getErr } = await supabase.storage.getBucket(bucketName);
    if (!bucket || getErr) {
      console.log(`[tenant-storage] Criando bucket '${bucketName}'...`);
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      });
    }
  } catch (err) {
    console.warn(`[tenant-storage] Aviso ao verificar/criar bucket '${bucketName}':`, err);
  }
}

/**
 * Upload direto de Buffer para o Supabase Storage com isolamento estrito por tenant_id
 */
export async function uploadTenantStorageBuffer({
  tenantId,
  buffer,
  photoType = "photo",
  contentType = "image/jpeg",
  bucket = ESTABLISHMENT_PHOTOS_BUCKET,
}: {
  tenantId: string;
  buffer: Buffer;
  photoType?: string;
  contentType?: string;
  bucket?: string;
}): Promise<{
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  bucket?: string;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();
    await ensureBucketExists(supabase, bucket);

    const filePath = generateTenantStoragePath(tenantId, photoType);
    let targetBucket = bucket;

    let { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    // Fallback defensivo de bucket caso não encontre o bucket primário
    if (uploadError && uploadError.message?.toLowerCase().includes("not found")) {
      console.warn(`[tenant-storage] Bucket '${targetBucket}' não encontrado, tentando fallback '${FALLBACK_STORAGE_BUCKET}'`);
      targetBucket = FALLBACK_STORAGE_BUCKET;
      await ensureBucketExists(supabase, targetBucket);

      const fallbackUpload = await supabase.storage
        .from(targetBucket)
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        });

      if (!fallbackUpload.error) {
        uploadError = null;
      } else {
        uploadError = fallbackUpload.error;
      }
    }

    if (uploadError) {
      console.error("[tenant-storage] Erro no upload:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(targetBucket).getPublicUrl(filePath);

    if (!publicUrl) {
      return { success: false, error: "Não foi possível gerar a URL pública da imagem." };
    }

    return {
      success: true,
      publicUrl,
      filePath,
      bucket: targetBucket,
    };
  } catch (err: any) {
    console.error("[tenant-storage] Exceção em uploadTenantStorageBuffer:", err);
    return { success: false, error: err?.message || "Erro inesperado no upload." };
  }
}

/**
 * Salva a URL retornada diretamente na coluna correspondente do tenant
 * (ex: cover_image_url, logo_url, banner_url ou na tabela tenant_photos)
 */
export async function saveTenantPhotoUrl({
  tenantId,
  publicUrl,
  targetColumn,
  photoType,
}: {
  tenantId: string;
  publicUrl: string;
  targetColumn?: "cover_image_url" | "banner_url" | "logo_url" | "place_photos" | "tenant_photos" | string;
  photoType?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const effectiveColumn = (targetColumn || photoType || "cover_image_url").toLowerCase();

    // 1. Capa / Banner (tenants.cover_image_url + tenant_profiles)
    if (
      effectiveColumn === "cover_image_url" ||
      effectiveColumn === "banner_url" ||
      effectiveColumn === "cover" ||
      effectiveColumn === "banner"
    ) {
      const { error: tErr } = await supabase
        .from("tenants")
        .update({
          cover_image_url: publicUrl,
          updated_at: now,
        })
        .eq("id", tenantId);

      if (tErr) {
        console.warn("[saveTenantPhotoUrl] Aviso ao salvar capa em tenants:", tErr.message);
      }

      // Sincronização defensiva em tenant_profiles se as colunas existirem
      try {
        await supabase
          .from("tenant_profiles")
          .update({
            cover_image_url: publicUrl,
            updated_at: now,
          })
          .eq("tenant_id", tenantId);
      } catch {}

      return { success: true };
    }

    // 2. Logotipo (tenant_profiles.logo_url)
    if (effectiveColumn === "logo_url" || effectiveColumn === "logo") {
      const { error: pErr } = await supabase
        .from("tenant_profiles")
        .update({
          logo_url: publicUrl,
          updated_at: now,
        })
        .eq("tenant_id", tenantId);

      if (pErr) {
        console.warn("[saveTenantPhotoUrl] Aviso ao salvar logo em tenant_profiles:", pErr.message);
      }

      return { success: true };
    }

    // 3. Fotos da vitrine / Galeria (tenant_profiles.place_photos ou tabela tenant_photos)
    if (
      effectiveColumn === "place_photos" ||
      effectiveColumn === "tenant_photos" ||
      effectiveColumn === "gallery" ||
      effectiveColumn === "photo"
    ) {
      // Busca fotos atuais para dar append sem sobrescrever
      const { data: profile } = await supabase
        .from("tenant_profiles")
        .select("place_photos")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      const currentPhotos: string[] = Array.isArray(profile?.place_photos)
        ? profile.place_photos.filter((p: any) => typeof p === "string")
        : [];

      if (!currentPhotos.includes(publicUrl)) {
        currentPhotos.push(publicUrl);
      }

      const { error: photoErr } = await supabase
        .from("tenant_profiles")
        .update({
          place_photos: currentPhotos,
          updated_at: now,
        })
        .eq("tenant_id", tenantId);

      if (photoErr) {
        console.warn("[saveTenantPhotoUrl] Aviso ao atualizar place_photos:", photoErr.message);
      }

      // Tenta inserir na tabela tenant_photos caso ela exista
      try {
        await supabase
          .from("tenant_photos")
          .insert({
            tenant_id: tenantId,
            url: publicUrl,
            photo_type: photoType || "gallery",
            created_at: now,
          });
      } catch {}

      return { success: true };
    }

    // Coluna genérica
    try {
      await supabase
        .from("tenants")
        .update({ [effectiveColumn]: publicUrl, updated_at: now })
        .eq("id", tenantId);
    } catch (colErr: any) {
      console.warn(`[saveTenantPhotoUrl] Não foi possível atualizar coluna genérica ${effectiveColumn}:`, colErr.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("[saveTenantPhotoUrl] Exceção:", err);
    return { success: false, error: err?.message || "Erro ao salvar URL no banco." };
  }
}

/**
 * Faz download de uma foto antiga do Google e faz upload no Supabase Storage com
 * PREVENÇÃO DE CORRUPÇÃO: se falhar com 403/404/rede, retorna o fallback elegante sem quebrar.
 */
export async function downloadAndPersistGoogleImage({
  url,
  tenantId,
  photoType = "photo",
  niche,
  category,
}: {
  url: string;
  tenantId: string;
  photoType?: string;
  niche?: string | null;
  category?: string | null;
}): Promise<{
  success: boolean;
  newUrl: string;
  isFallback: boolean;
  error?: string;
}> {
  const fallbackUrl = getNicheFallbackImage(niche, category);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(
        `[downloadAndPersistGoogleImage] HTTP ${res.status} ${res.statusText} ao baixar imagem do Google para tenant ${tenantId}. Aplicando fallback elegante.`
      );
      return {
        success: false,
        newUrl: fallbackUrl,
        isFallback: true,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      console.warn(`[downloadAndPersistGoogleImage] Imagem com buffer vazio (<100 bytes). Aplicando fallback.`);
      return {
        success: false,
        newUrl: fallbackUrl,
        isFallback: true,
        error: "Buffer vazio",
      };
    }

    // Determina o contentType baseado na resposta
    const contentType = res.headers.get("content-type") || "image/jpeg";

    const uploadRes = await uploadTenantStorageBuffer({
      tenantId,
      buffer,
      photoType,
      contentType,
      bucket: ESTABLISHMENT_PHOTOS_BUCKET,
    });

    if (!uploadRes.success || !uploadRes.publicUrl) {
      console.warn(`[downloadAndPersistGoogleImage] Falha no upload para o Supabase Storage: ${uploadRes.error}. Aplicando fallback.`);
      return {
        success: false,
        newUrl: fallbackUrl,
        isFallback: true,
        error: uploadRes.error,
      };
    }

    return {
      success: true,
      newUrl: uploadRes.publicUrl,
      isFallback: false,
    };
  } catch (err: any) {
    console.warn(
      `[downloadAndPersistGoogleImage] Exceção ao processar imagem para tenant ${tenantId}: ${err?.message}. Aplicando fallback elegante.`
    );
    return {
      success: false,
      newUrl: fallbackUrl,
      isFallback: true,
      error: err?.message || "Exceção ao processar imagem",
    };
  }
}
