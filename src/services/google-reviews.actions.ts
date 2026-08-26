"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export interface SyncGoogleReviewsParams {
  placeId?: string;
  tenantId?: string;
}

export interface SyncGoogleReviewsResult {
  success: boolean;
  data?: {
    reviewsCount: number;
    rating: number;
    userRatingsTotal: number;
    placeName?: string;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      relative_time?: string;
      profile_photo_url?: string;
      author_url?: string;
    }>;
  };
  error?: string;
}

/**
 * Server Action: Sincroniza avaliações reais e métricas do Google Meu Negócio usando a Google Places API
 */
export async function syncGoogleReviews(
  params?: SyncGoogleReviewsParams
): Promise<SyncGoogleReviewsResult> {
  try {
    const supabase = await createClient();

    // 1. Obter tenant autenticado
    let tenantId = params?.tenantId;
    let tenantSlug = "meu-negocio";

    const { data: tenantContext, error: authError } = await getAuthenticatedTenant();
    if (!tenantId) {
      if (authError || !tenantContext) {
        return {
          success: false,
          error: authError || "Sessão expirada. Faça login novamente.",
        };
      }
      tenantId = tenantContext.tenantId;
      tenantSlug = tenantContext.tenant?.slug || "meu-negocio";
    }

    // 2. Obter placeId se não foi fornecido
    let targetPlaceId = params?.placeId?.trim();
    if (!targetPlaceId) {
      const { data: profile } = await supabase
        .from("tenant_profiles")
        .select("google_place_id, google_maps_url")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      targetPlaceId = profile?.google_place_id?.trim() || "";

      // Se não tiver place_id mas tiver google_maps_url, tenta extrair
      if (!targetPlaceId && profile?.google_maps_url) {
        const url = profile.google_maps_url;
        const placeIdMatch = url.match(/place_id[:=]([A-Za-z0-9_-]+)/i) || url.match(/1s([A-Za-z0-9_-]{27})/i);
        if (placeIdMatch) {
          targetPlaceId = placeIdMatch[1];
        }
      }
    }

    if (!targetPlaceId) {
      return {
        success: false,
        error: "Informe o Place ID do Google para sincronizar as avaliações reais.",
      };
    }

    // 3. Obter chave de API
    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "Chave GOOGLE_PLACES_API_KEY não encontrada no arquivo de ambiente.",
      };
    }

    // 4. Executar Fetch no endpoint oficial da Google Places API (Place Details)
    const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      targetPlaceId
    )}&fields=name,rating,user_ratings_total,reviews&language=pt-BR&key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Erro ao conectar com Google Places API: HTTP ${res.status}`,
      };
    }

    const data = await res.json();

    if (data.status !== "OK" || !data.result) {
      const errMsg = data.error_message || data.status || "Nenhum resultado encontrado para o Place ID informado.";
      return {
        success: false,
        error: `Google Places API retornou erro: ${errMsg}`,
      };
    }

    const placeResult = data.result;
    const rating = Number(placeResult.rating) || 5.0;
    const userRatingsTotal = Number(placeResult.user_ratings_total) || 0;
    const rawReviews = Array.isArray(placeResult.reviews) ? placeResult.reviews : [];

    // 5. Atualizar na tabela tenants
    await supabase
      .from("tenants")
      .update({
        google_rating: rating,
        google_reviews_count: userRatingsTotal,
      })
      .eq("id", tenantId);

    // 6. Atualizar na tabela tenant_profiles
    await supabase
      .from("tenant_profiles")
      .update({
        google_rating: rating,
        google_reviews_count: userRatingsTotal,
        rating: rating,
        review_count: userRatingsTotal,
        google_place_id: targetPlaceId,
      })
      .eq("tenant_id", tenantId);

    // 7. Mapear e Inserir Avaliações Oficiais em tenant_reviews
    const reviewsToInsert = rawReviews.map((rev: any) => ({
      tenant_id: tenantId,
      author_name: rev.author_name || "Cliente Google",
      rating: Number(rev.rating) || 5,
      review_text: rev.text || "",
      text: rev.text || "",
      relative_time: rev.relative_time_description || "recentemente",
      relative_time_description: rev.relative_time_description || "recentemente",
      author_photo_url: rev.profile_photo_url || null,
      profile_photo_url: rev.profile_photo_url || null,
      author_url: rev.author_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (reviewsToInsert.length > 0) {
      // Limpa avaliações anteriores para evitar duplicidade
      await supabase
        .from("tenant_reviews")
        .delete()
        .eq("tenant_id", tenantId);

      const { error: insertError } = await supabase
        .from("tenant_reviews")
        .insert(reviewsToInsert);

      if (insertError) {
        console.error("[syncGoogleReviews] Erro ao inserir avaliações:", insertError);
      }
    }

    // 8. Revalidação de Cache
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/perfil");
    revalidatePath(`/${tenantSlug}`);

    return {
      success: true,
      data: {
        reviewsCount: reviewsToInsert.length,
        rating,
        userRatingsTotal,
        placeName: placeResult.name,
        reviews: reviewsToInsert,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao sincronizar avaliações.";
    console.error("[syncGoogleReviews] Exceção:", err);
    return { success: false, error: msg };
  }
}
