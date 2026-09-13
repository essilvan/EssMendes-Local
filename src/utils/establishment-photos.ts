import { detectNicheTheme } from "@/config/tenant-themes";
import type { TenantProfile } from "@/types";

/**
 * Fotos profissionais em alta resolução do Unsplash organizadas por nicho de atuação.
 * Utilizadas como fallback elegante e autêntico quando o estabelecimento ainda não possui fotos cadastradas.
 */
export const NICHE_FALLBACK_IMAGES = {
  gastronomia: {
    hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  barbearia: {
    hero: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  automotivo: {
    hero: "https://images.unsplash.com/photo-1613214149922-f1809c99b414?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  estetica_saude: {
    hero: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  servicos: {
    hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1000&auto=format&fit=crop",
    ],
  },
};

/**
 * Retorna imagem de fallback apropriada de acordo com o nicho do estabelecimento
 */
export function getNicheFallbackImage(
  nicheKey?: string | null,
  category?: string | null,
  googleTypes?: string[] | null
): string {
  const effectiveNiche =
    nicheKey || detectNicheTheme(category, googleTypes || undefined);

  if (effectiveNiche === "gastronomia" || effectiveNiche === "food") {
    return NICHE_FALLBACK_IMAGES.gastronomia.hero;
  }
  if (effectiveNiche === "barbearia") {
    return NICHE_FALLBACK_IMAGES.barbearia.hero;
  }
  if (effectiveNiche === "automotivo" || effectiveNiche === "auto") {
    return NICHE_FALLBACK_IMAGES.automotivo.hero;
  }
  if (effectiveNiche === "estetica_saude" || effectiveNiche === "health_beauty") {
    return NICHE_FALLBACK_IMAGES.estetica_saude.hero;
  }
  return NICHE_FALLBACK_IMAGES.servicos.hero;
}

export interface UnifiedEstablishmentPhotos {
  /** Foto principal destacada (com fallback inteligente garantido) */
  heroImage: string;
  /** Foto principal original do banco, se existente */
  rawHeroImage: string | null;
  /** Fotos secundárias reais do estabelecimento (posição 1 a 6) */
  galleryPhotos: string[];
  /** Todas as fotos cadastradas (incluindo principal e secundárias) */
  allPhotos: string[];
  /** Se o estabelecimento possui imagens reais sincronizadas ou enviadas */
  hasRealPhotos: boolean;
}

/**
 * 1. FONTE UNIFICADA DE IMAGENS DO ESTABELECIMENTO
 * 
 * Extrai a imagem principal com fallback robusto e a lista de fotos secundárias
 * do local conforme as diretrizes do projeto:
 * 
 * const heroImage = 
 *   tenant.cover_image_url || 
 *   (Array.isArray(tenant.photos) && tenant.photos.length > 0 ? tenant.photos[0] : null) ||
 *   tenant.google_photo_url ||
 *   null;
 * 
 * const galleryPhotos = Array.isArray(tenant.photos) && tenant.photos.length > 1 
 *   ? tenant.photos.slice(1, 7) 
 *   : [];
 */
export function getUnifiedEstablishmentPhotos(
  tenant: {
    cover_image_url?: string | null;
    photos?: string[] | null;
    google_photo_url?: string | null;
    category?: string | null;
    google_types?: string[] | null;
    theme_niche?: string | null;
    theme_settings?: { niche?: string; [key: string]: any } | null;
    [key: string]: any;
  },
  profile?: TenantProfile | null
): UnifiedEstablishmentPhotos {
  // 1. Coleta e consolidação de todas as fontes de fotos
  const rawList: any[] = [];
  if (Array.isArray(tenant.photos)) rawList.push(...tenant.photos);
  if (Array.isArray(profile?.place_photos)) rawList.push(...profile.place_photos);
  if (Array.isArray((profile as any)?.photos)) rawList.push(...(profile as any).photos);

  // Filtra URLs válidas e remove duplicatas mantendo a ordem original
  const allPhotos = Array.from(
    new Set(
      rawList.filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0
      )
    )
  );

  // 2. Extração da heroImage seguindo a hierarquia obrigatória
  const rawHeroImage =
    tenant.cover_image_url ||
    (Array.isArray(tenant.photos) && tenant.photos.length > 0 ? tenant.photos[0] : null) ||
    tenant.google_photo_url ||
    profile?.hero_image_url ||
    (Array.isArray(profile?.place_photos) && profile.place_photos.length > 0 ? profile.place_photos[0] : null) ||
    (allPhotos.length > 0 ? allPhotos[0] : null) ||
    (profile as any)?.google_photo_url ||
    null;

  // 3. Fallback inteligente de alta resolução por nicho
  const effectiveNiche =
    tenant.theme_settings?.niche ||
    tenant.theme_niche ||
    profile?.business_category ||
    tenant.category;
  const fallbackHero = getNicheFallbackImage(
    effectiveNiche,
    tenant.category || profile?.business_category,
    tenant.google_types
  );
  const heroImage = rawHeroImage || fallbackHero;

  // 4. Lista de fotos secundárias do local (slice 1 a 7)
  const photosSource =
    Array.isArray(tenant.photos) && tenant.photos.length > 0
      ? tenant.photos
      : allPhotos;

  const galleryPhotos =
    photosSource.length > 1 ? photosSource.slice(1, 7) : [];

  const hasRealPhotos = Boolean(rawHeroImage) || allPhotos.length > 0;

  return {
    heroImage,
    rawHeroImage,
    galleryPhotos,
    allPhotos: allPhotos.length > 0 ? allPhotos : [heroImage],
    hasRealPhotos,
  };
}
