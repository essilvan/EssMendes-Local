"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export interface SyncGoogleReviewsParams {
  input?: string; // URL do Google Maps, CID, nome da empresa ou Place ID
  placeId?: string; // Mantido para compatibilidade regressiva
  tenantId?: string;
}

export interface SyncGoogleReviewsResult {
  success: boolean;
  data?: {
    placeId: string;
    reviewsCount: number;
    rating: number;
    userRatingsTotal: number;
    placeName?: string;
    placePhotos?: string[];
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
 * Resolve URLs encurtadas do Google Maps (ex: maps.app.goo.gl ou goo.gl/maps)
 */
async function resolveShortGoogleMapsUrl(url: string): Promise<string> {
  if (!url.startsWith("http")) return url;
  if (!url.includes("goo.gl") && !url.includes("maps.app.goo.gl")) {
    return url;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    return res.url || url;
  } catch (err) {
    console.warn("[resolveShortGoogleMapsUrl] Erro ao desencarar URL curta:", err);
    return url;
  }
}

/**
 * Server Action: Sincroniza avaliações reais e métricas do Google Meu Negócio usando a Google Places API.
 * Aceita URL do Google Maps (curta ou completa), CID, nome do estabelecimento ou Place ID direto.
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

    // 2. Determinar o parâmetro de entrada
    const rawInput = (params?.input || params?.placeId || "").trim();

    // 3. Obter chave da API do Google
    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "Chave GOOGLE_PLACES_API_KEY não configurada no ambiente da aplicação.",
      };
    }

    let targetPlaceId = "";
    let resolvedUrl = "";
    let textQuery = "";

    // 4. Se o usuário passou um input direto
    if (rawInput) {
      // 4.1 Se for um Place ID direto no formato ChIJ...
      if (rawInput.startsWith("ChIJ") && rawInput.length >= 20) {
        targetPlaceId = rawInput;
      } else if (rawInput.startsWith("http")) {
        // 4.2 Se for uma URL do Google Maps
        resolvedUrl = await resolveShortGoogleMapsUrl(rawInput);

        // Tenta extrair place_id explícito na URL
        const explicitMatch =
          resolvedUrl.match(/[?&]place_id=([a-zA-Z0-9_\-]+)/i) ||
          resolvedUrl.match(/(ChIJ[a-zA-Z0-9_\-]{20,})/);

        if (explicitMatch && explicitMatch[1]) {
          targetPlaceId = explicitMatch[1];
        } else {
          // Extrai o nome da empresa ou query a partir da URL
          const placeMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
          if (placeMatch && placeMatch[1]) {
            textQuery = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
          } else {
            const queryMatch =
              resolvedUrl.match(/[?&]q=([^&]+)/) || resolvedUrl.match(/[?&]query=([^&]+)/);
            if (queryMatch && queryMatch[1]) {
              textQuery = decodeURIComponent(queryMatch[1].replace(/\+/g, " ")).trim();
            } else {
              textQuery = resolvedUrl;
            }
          }
        }
      } else {
        // 4.3 Se for texto genérico (ex: nome da empresa)
        textQuery = rawInput;
      }
    } else {
      // Se não passou input, tenta recuperar do perfil existente no banco
      const { data: profile } = await supabase
        .from("tenant_profiles")
        .select("google_place_id, google_maps_url, name")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (profile?.google_place_id?.startsWith("ChIJ")) {
        targetPlaceId = profile.google_place_id.trim();
      } else if (profile?.google_maps_url) {
        resolvedUrl = await resolveShortGoogleMapsUrl(profile.google_maps_url);
        const explicitMatch =
          resolvedUrl.match(/[?&]place_id=([a-zA-Z0-9_\-]+)/i) ||
          resolvedUrl.match(/(ChIJ[a-zA-Z0-9_\-]{20,})/);

        if (explicitMatch && explicitMatch[1]) {
          targetPlaceId = explicitMatch[1];
        } else {
          const placeMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
          textQuery = placeMatch
            ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim()
            : profile.name || "";
        }
      } else if (profile?.name) {
        textQuery = profile.name;
      }
    }

    // 5. Se ainda não possui o Place ID direto e possui texto de busca, realiza Find Place
    if (!targetPlaceId && textQuery) {
      try {
        const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
          textQuery
        )}&inputtype=textquery&fields=place_id,name,formatted_address&key=${apiKey}`;

        const findRes = await fetch(findPlaceUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
          next: { revalidate: 0 },
        });

        if (findRes.ok) {
          const findData = await findRes.json();
          if (
            findData.status === "OK" &&
            Array.isArray(findData.candidates) &&
            findData.candidates.length > 0 &&
            findData.candidates[0].place_id
          ) {
            targetPlaceId = findData.candidates[0].place_id;
          }
        }

        // Fallback: Text Search caso Find Place não localize
        if (!targetPlaceId) {
          const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            textQuery
          )}&language=pt-BR&key=${apiKey}`;

          const textRes = await fetch(textSearchUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            next: { revalidate: 0 },
          });

          if (textRes.ok) {
            const textData = await textRes.json();
            if (
              textData.status === "OK" &&
              Array.isArray(textData.results) &&
              textData.results.length > 0 &&
              textData.results[0].place_id
            ) {
              targetPlaceId = textData.results[0].place_id;
            }
          }
        }
      } catch (findErr) {
        console.warn("[syncGoogleReviews] Erro ao buscar Place ID via texto:", findErr);
      }
    }

    if (!targetPlaceId) {
      return {
        success: false,
        error:
          "Não foi possível localizar o estabelecimento no Google Maps. Verifique o link ou informe o Place ID oficial.",
      };
    }

    // 6. Consulta de Detalhes Oficiais (Place Details)
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      targetPlaceId
    )}&fields=name,rating,user_ratings_total,reviews,photos,url&language=pt-BR&key=${apiKey}`;

    const res = await fetch(detailsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Erro de conexão com a Google Places API: HTTP ${res.status}`,
      };
    }

    const data = await res.json();

    if (data.status !== "OK" || !data.result) {
      const errMsg =
        data.error_message ||
        data.status ||
        "Nenhum detalhe retornado para o Place ID informado.";
      return {
        success: false,
        error: `Google Places API retornou erro: ${errMsg}`,
      };
    }

    const placeResult = data.result;
    const rating = Number(placeResult.rating) || 5.0;
    const userRatingsTotal = Number(placeResult.user_ratings_total) || 0;
    const rawReviews = Array.isArray(placeResult.reviews) ? placeResult.reviews : [];

    // Extração das Fotos Oficiais em Alta Resolução
    const photoUrls: string[] = Array.isArray(placeResult.photos)
      ? placeResult.photos
          .slice(0, 10)
          .map((p: any) =>
            p.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${p.photo_reference}&key=${apiKey}`
              : null
          )
          .filter((u: string | null): u is string => Boolean(u))
      : [];

    // 7. Atualizar na tabela tenants (incluindo a coluna google_place_id)
    await supabase
      .from("tenants")
      .update({
        google_place_id: targetPlaceId,
        google_rating: rating,
        google_reviews_count: userRatingsTotal,
      })
      .eq("id", tenantId);

    // 8. Atualizar na tabela tenant_profiles
    const profileUpdates: Record<string, any> = {
      google_place_id: targetPlaceId,
      google_rating: rating,
      google_reviews_count: userRatingsTotal,
      rating: rating,
      review_count: userRatingsTotal,
    };

    if (photoUrls.length > 0) {
      profileUpdates.place_photos = photoUrls;
    }
    if (resolvedUrl && resolvedUrl.startsWith("http")) {
      profileUpdates.google_maps_url = resolvedUrl;
    } else if (placeResult.url) {
      profileUpdates.google_maps_url = placeResult.url;
    }

    await supabase
      .from("tenant_profiles")
      .update(profileUpdates)
      .eq("tenant_id", tenantId);

    // 9. Atualizar ou registrar na tabela tenant_integrations
    try {
      await supabase
        .from("tenant_integrations")
        .upsert(
          {
            tenant_id: tenantId,
            provider: "google_places",
            google_place_id: targetPlaceId,
            status: "active",
            is_connected: true,
            sync_frequency: "daily",
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,provider" }
        );
    } catch (intErr) {
      console.warn("[syncGoogleReviews] Aviso ao registrar integração:", intErr);
    }

    // 10. Mapear e Inserir Avaliações Oficiais em tenant_reviews
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

    // 11. Revalidação de Cache
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/integracoes");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/${tenantSlug}`);

    return {
      success: true,
      data: {
        placeId: targetPlaceId,
        reviewsCount: reviewsToInsert.length,
        rating,
        userRatingsTotal,
        placeName: placeResult.name,
        placePhotos: photoUrls,
        reviews: reviewsToInsert,
      },
    };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Erro inesperado ao sincronizar avaliações.";
    console.error("[syncGoogleReviews] Exceção:", err);
    return { success: false, error: msg };
  }
}
