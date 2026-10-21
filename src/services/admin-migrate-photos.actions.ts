"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant, checkIsSuperAdmin } from "@/lib/supabase/tenant";
import {
  downloadAndPersistGoogleImage,
  isGooglePhotoUrl,
  ESTABLISHMENT_PHOTOS_BUCKET,
} from "./tenant-storage.service";
import { NICHE_FALLBACK_IMAGES } from "@/utils/establishment-photos";
import { revalidatePath } from "next/cache";

export interface MigrationSummary {
  success: boolean;
  totalMigrados: number;
  falhas: number;
  totalTenantsVerificados: number;
  totalTenantsComGoogleUrls: number;
  detalhes: Array<{
    tenantId: string;
    tenantName: string;
    slug: string;
    migrados: number;
    falhas: number;
    detalhesFotos: Array<{
      campo: string;
      originalUrl: string;
      novaUrl: string;
      sucesso: boolean;
      motivo?: string;
    }>;
  }>;
  error?: string;
}

/**
 * Utilitário de delay assíncrono para rate limiting
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Motor central de migração em massa de imagens antigas do Google para Supabase Storage
 */
export async function migrateGooglePhotosToSupabaseStorage({
  tenantId,
  dryRun = false,
  delayMs = 150,
}: {
  tenantId?: string;
  dryRun?: boolean;
  delayMs?: number;
} = {}): Promise<MigrationSummary> {
  const supabase = createAdminClient();

  let totalMigrados = 0;
  let falhas = 0;
  let totalTenantsComGoogleUrls = 0;
  const detalhes: MigrationSummary["detalhes"] = [];

  try {
    // 1. Garante que o bucket establishment-photos existe
    try {
      const { data: bucket, error: bErr } = await supabase.storage.getBucket(ESTABLISHMENT_PHOTOS_BUCKET);
      if (!bucket || bErr) {
        console.log(`[migrate-photos] Criando bucket '${ESTABLISHMENT_PHOTOS_BUCKET}'...`);
        await supabase.storage.createBucket(ESTABLISHMENT_PHOTOS_BUCKET, {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        });
      }
    } catch (bucketErr) {
      console.warn("[migrate-photos] Aviso ao verificar/criar bucket:", bucketErr);
    }

    // 2. Busca tenants ativos
    let tenantsQuery = supabase
      .from("tenants")
      .select("id, name, slug, cover_image_url, theme_niche, is_active");

    if (tenantId) {
      tenantsQuery = tenantsQuery.eq("id", tenantId);
    }

    const { data: tenants, error: tenantsErr } = await tenantsQuery;

    if (tenantsErr || !tenants) {
      console.error("[migrate-photos] Erro ao buscar tenants:", tenantsErr);
      return {
        success: false,
        totalMigrados: 0,
        falhas: 0,
        totalTenantsVerificados: 0,
        totalTenantsComGoogleUrls: 0,
        detalhes: [],
        error: `Erro ao buscar estabelecimentos: ${tenantsErr?.message}`,
      };
    }

    // 3. Busca perfis correspondentes
    const tenantIds = tenants.map((t) => t.id);
    const { data: profiles, error: profilesErr } = await supabase
      .from("tenant_profiles")
      .select("tenant_id, logo_url, place_photos, business_category")
      .in("tenant_id", tenantIds);

    if (profilesErr) {
      console.warn("[migrate-photos] Aviso ao buscar tenant_profiles:", profilesErr);
    }

    const profileMap = new Map<string, any>();
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.tenant_id, p);
      }
    }

    console.log(
      `[migrate-photos] Iniciando verificação de ${tenants.length} tenants... (dryRun: ${dryRun})`
    );

    // 4. Itera sobre cada tenant em fila com delay para respeitar limites de taxa
    for (const tenant of tenants) {
      const profile = profileMap.get(tenant.id) || null;
      const tenantNiche = tenant.theme_niche || profile?.business_category || "servicos";

      let tenantMigrados = 0;
      let tenantFalhas = 0;
      const fotosDetalhes: Array<{
        campo: string;
        originalUrl: string;
        novaUrl: string;
        sucesso: boolean;
        motivo?: string;
      }> = [];

      let newCoverUrl: string | null = tenant.cover_image_url;
      let newLogoUrl: string | null = profile?.logo_url || null;
      let newPlacePhotos: string[] = Array.isArray(profile?.place_photos)
        ? [...profile.place_photos]
        : [];

      let hasGoogleUrls = false;

      // 4.1 Verifica Foto de Capa (cover_image_url em tenants)
      if (isGooglePhotoUrl(tenant.cover_image_url)) {
        hasGoogleUrls = true;
        await sleep(delayMs);

        console.log(`[migrate-photos] Migrando capa do tenant '${tenant.name}' (${tenant.id})...`);
        const result = await downloadAndPersistGoogleImage({
          url: tenant.cover_image_url!,
          tenantId: tenant.id,
          photoType: "cover",
          niche: tenantNiche,
          category: profile?.business_category,
        });

        if (result.success && !result.isFallback) {
          tenantMigrados++;
          totalMigrados++;
          newCoverUrl = result.newUrl;
          fotosDetalhes.push({
            campo: "cover_image_url",
            originalUrl: tenant.cover_image_url!,
            novaUrl: result.newUrl,
            sucesso: true,
          });
        } else {
          // Prevenção de corrupção: aplica fallback padrão elegante
          tenantFalhas++;
          falhas++;
          newCoverUrl = result.newUrl; // Fallback elegante do Unsplash por nicho
          fotosDetalhes.push({
            campo: "cover_image_url",
            originalUrl: tenant.cover_image_url!,
            novaUrl: result.newUrl,
            sucesso: false,
            motivo: result.error || "Falha HTTP 403/404 ou rede. Fallback aplicado.",
          });
        }
      }

      // 4.2 Verifica Logotipo (logo_url em tenant_profiles)
      if (profile && isGooglePhotoUrl(profile.logo_url)) {
        hasGoogleUrls = true;
        await sleep(delayMs);

        console.log(`[migrate-photos] Migrando logo do tenant '${tenant.name}' (${tenant.id})...`);
        const result = await downloadAndPersistGoogleImage({
          url: profile.logo_url,
          tenantId: tenant.id,
          photoType: "logo",
          niche: tenantNiche,
          category: profile.business_category,
        });

        if (result.success && !result.isFallback) {
          tenantMigrados++;
          totalMigrados++;
          newLogoUrl = result.newUrl;
          fotosDetalhes.push({
            campo: "logo_url",
            originalUrl: profile.logo_url,
            novaUrl: result.newUrl,
            sucesso: true,
          });
        } else {
          tenantFalhas++;
          falhas++;
          // Se falhou o download do logo, mantém o fallback ou URL segura
          newLogoUrl = result.newUrl;
          fotosDetalhes.push({
            campo: "logo_url",
            originalUrl: profile.logo_url,
            novaUrl: result.newUrl,
            sucesso: false,
            motivo: result.error || "Falha HTTP 403/404 no logo. Fallback aplicado.",
          });
        }
      }

      // 4.3 Verifica Fotos do Estabelecimento (place_photos em tenant_profiles)
      if (Array.isArray(profile?.place_photos) && profile.place_photos.length > 0) {
        const updatedPhotosList: string[] = [];

        for (let i = 0; i < profile.place_photos.length; i++) {
          const photoUrl = profile.place_photos[i];

          if (isGooglePhotoUrl(photoUrl)) {
            hasGoogleUrls = true;
            await sleep(delayMs);

            console.log(
              `[migrate-photos] Migrando foto [${i + 1}/${profile.place_photos.length}] do tenant '${tenant.name}'...`
            );

            const result = await downloadAndPersistGoogleImage({
              url: photoUrl,
              tenantId: tenant.id,
              photoType: `gallery_${i + 1}`,
              niche: tenantNiche,
              category: profile.business_category,
            });

            if (result.success && !result.isFallback) {
              tenantMigrados++;
              totalMigrados++;
              updatedPhotosList.push(result.newUrl);
              fotosDetalhes.push({
                campo: `place_photos[${i}]`,
                originalUrl: photoUrl,
                novaUrl: result.newUrl,
                sucesso: true,
              });
            } else {
              // Prevenção de corrupção: substitui por foto de galeria elegante do nicho
              tenantFalhas++;
              falhas++;
              const nicheKey = (tenantNiche as keyof typeof NICHE_FALLBACK_IMAGES) in NICHE_FALLBACK_IMAGES
                ? (tenantNiche as keyof typeof NICHE_FALLBACK_IMAGES)
                : "servicos";
              const galleryFallbacks = NICHE_FALLBACK_IMAGES[nicheKey].gallery;
              const fallbackGalleryPhoto = galleryFallbacks[i % galleryFallbacks.length] || result.newUrl;

              updatedPhotosList.push(fallbackGalleryPhoto);
              fotosDetalhes.push({
                campo: `place_photos[${i}]`,
                originalUrl: photoUrl,
                novaUrl: fallbackGalleryPhoto,
                sucesso: false,
                motivo: result.error || "Falha HTTP 403/404 na foto de galeria. Fallback aplicado.",
              });
            }
          } else {
            updatedPhotosList.push(photoUrl);
          }
        }

        newPlacePhotos = updatedPhotosList;
      }

      if (hasGoogleUrls) {
        totalTenantsComGoogleUrls++;

        // 5. Atualiza o banco de dados se não for simulação (dryRun)
        if (!dryRun) {
          const now = new Date().toISOString();

          // 5.1 Atualiza tabela tenants
          if (newCoverUrl !== tenant.cover_image_url) {
            const { error: tUpdateErr } = await supabase
              .from("tenants")
              .update({
                cover_image_url: newCoverUrl,
                updated_at: now,
              })
              .eq("id", tenant.id);

            if (tUpdateErr) {
              console.error(
                `[migrate-photos] Erro ao atualizar cover_image_url no tenant ${tenant.id}:`,
                tUpdateErr
              );
            }
          }

          // 5.2 Atualiza tabela tenant_profiles
          if (profile) {
            const profileUpdatePayload: Record<string, any> = {
              updated_at: now,
            };

            if (newLogoUrl !== profile.logo_url) {
              profileUpdatePayload.logo_url = newLogoUrl;
            }

            profileUpdatePayload.place_photos = newPlacePhotos;

            const { error: pUpdateErr } = await supabase
              .from("tenant_profiles")
              .update(profileUpdatePayload)
              .eq("tenant_id", tenant.id);

            if (pUpdateErr) {
              console.error(
                `[migrate-photos] Erro ao atualizar tenant_profiles do tenant ${tenant.id}:`,
                pUpdateErr
              );
            }
          }

          // 5.3 Revalidação de Cache
          try {
            if (tenant.slug) {
              revalidatePath(`/${tenant.slug}`);
            }
          } catch {}
        }

        detalhes.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          slug: tenant.slug,
          migrados: tenantMigrados,
          falhas: tenantFalhas,
          detalhesFotos: fotosDetalhes,
        });
      }
    }

    try {
      revalidatePath("/[slug]", "page");
      revalidatePath("/admin/perfil");
    } catch {}

    console.log(
      `[migrate-photos] Concluído! Total Migrados: ${totalMigrados}, Falhas: ${falhas}, Tenants com fotos: ${totalTenantsComGoogleUrls}`
    );

    return {
      success: true,
      totalMigrados,
      falhas,
      totalTenantsVerificados: tenants.length,
      totalTenantsComGoogleUrls,
      detalhes,
    };
  } catch (err: any) {
    console.error("[migrate-photos] Erro fatal no motor de migração:", err);
    return {
      success: false,
      totalMigrados,
      falhas,
      totalTenantsVerificados: 0,
      totalTenantsComGoogleUrls,
      detalhes,
      error: err?.message || "Erro inesperado ao executar migração de fotos.",
    };
  }
}

/**
 * Server Action administrativa para disparo manual pelo painel
 */
export async function executePhotosMigrationAction(options: {
  tenantId?: string;
  dryRun?: boolean;
} = {}): Promise<MigrationSummary> {
  const { data: tenantContext, error: authError } = await getAuthenticatedTenant();

  if (authError || !tenantContext) {
    return {
      success: false,
      totalMigrados: 0,
      falhas: 0,
      totalTenantsVerificados: 0,
      totalTenantsComGoogleUrls: 0,
      detalhes: [],
      error: authError || "Autenticação requerida.",
    };
  }

  // Apenas Super Admin ou o próprio Tenant autenticado (se filtrado para si mesmo)
  if (!tenantContext.isSuperAdmin) {
    if (!options.tenantId || options.tenantId !== tenantContext.tenantId) {
      options.tenantId = tenantContext.tenantId;
    }
  }

  return migrateGooglePhotosToSupabaseStorage(options);
}
