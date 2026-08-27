"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import { syncGooglePlaceData } from "@/lib/actions/google-places.actions";
import type { TenantIntegration } from "@/types";

export interface IntegrationStatusResult {
  success: boolean;
  data?: {
    isConnected: boolean;
    locationName?: string | null;
    googlePlaceId?: string | null;
    googleMapsUrl?: string | null;
    lastSyncedAt?: string | null;
    syncStatus?: string;
    syncMessage?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  };
  error?: string;
}

/**
 * Obtém o status da integração do Google Business Profile do tenant
 */
export async function getGoogleIntegrationStatus(): Promise<IntegrationStatusResult> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const supabase = await createClient();
    const tenantId = tenantCtx.tenantId;

    // 1. Busca perfil para conferir se já possui Place ID ou URL configurados
    const { data: profile } = await supabase
      .from("tenant_profiles")
      .select("name, google_place_id, google_maps_url, rating, google_rating, review_count, google_reviews_count")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    // 2. Busca da tabela de integrações
    const { data: integration } = await supabase
      .from("tenant_integrations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("provider", "google_business")
      .maybeSingle();

    const isConnected = Boolean(
      integration?.is_connected ||
      Boolean(profile?.google_place_id && profile?.google_place_id.trim().length > 0)
    );

    return {
      success: true,
      data: {
        isConnected,
        locationName: integration?.location_name || profile?.name || tenantCtx.tenant?.name,
        googlePlaceId: integration?.location_id || profile?.google_place_id,
        googleMapsUrl: profile?.google_maps_url,
        lastSyncedAt: integration?.last_synced_at || null,
        syncStatus: integration?.sync_status || (isConnected ? "success" : "idle"),
        syncMessage: integration?.sync_message || null,
        rating: profile?.google_rating ?? profile?.rating ?? 5.0,
        reviewCount: profile?.google_reviews_count ?? profile?.review_count ?? 0,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar status da integração.";
    return { success: false, error: msg };
  }
}

/**
 * Conecta ou atualiza o estabelecimento Google e executa a sincronização atômica
 */
export async function syncAndConnectGoogleAction(params: {
  placeIdOrUrl: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const tenantId = tenantCtx.tenantId;
    const input = params.placeIdOrUrl.trim();

    if (!input) {
      return { success: false, error: "Informe o Place ID ou o Link do Google Maps." };
    }

    const supabase = await createClient();

    // 1. Marca status como syncing
    await supabase
      .from("tenant_integrations")
      .upsert(
        {
          tenant_id: tenantId,
          provider: "google_business",
          sync_status: "syncing",
          sync_message: "Sincronizando dados com o Google Places...",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    // 2. Executa a sincronização oficial resiliente do Places API (New)
    const syncRes = await syncGooglePlaceData(input);

    if (syncRes.error || !syncRes.data) {
      await supabase
        .from("tenant_integrations")
        .upsert(
          {
            tenant_id: tenantId,
            provider: "google_business",
            sync_status: "error",
            sync_message: syncRes.error || "Falha ao sincronizar com Google Places API.",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id" }
        );

      return {
        success: false,
        error: syncRes.error || "Não foi possível sincronizar com o Google.",
      };
    }

    const nowIso = new Date().toISOString();

    // 3. Atualiza tenant_integrations com sucesso
    await supabase
      .from("tenant_integrations")
      .upsert(
        {
          tenant_id: tenantId,
          provider: "google_business",
          is_connected: true,
          location_name: syncRes.data.companyName,
          last_synced_at: nowIso,
          sync_status: "success",
          sync_message: `Sincronizado com sucesso: ${syncRes.data.reviewsCountImported} avaliações e ${syncRes.data.photosCountImported} fotos importadas.`,
          metadata: {
            rating: syncRes.data.rating,
            reviewCount: syncRes.data.reviewCount,
            address: syncRes.data.address,
            phone: syncRes.data.phoneWhatsapp,
          },
          updated_at: nowIso,
        },
        { onConflict: "tenant_id" }
      );

    // 4. Atualiza last_synced_at no tenant
    await supabase
      .from("tenants")
      .update({ last_synced_at: nowIso, updated_at: nowIso })
      .eq("id", tenantId);

    revalidatePath("/admin/integracoes");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/avaliacoes");

    return {
      success: true,
      message: `Estabelecimento "${syncRes.data.companyName}" conectado e sincronizado com sucesso!`,
      data: syncRes.data,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao conectar Google.";
    return { success: false, error: msg };
  }
}

/**
 * Desconecta a integração do Google
 */
export async function disconnectGoogleAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    const supabase = await createClient();
    await supabase
      .from("tenant_integrations")
      .update({
        is_connected: false,
        sync_status: "idle",
        sync_message: "Integração desconectada pelo usuário.",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantCtx.tenantId)
      .eq("provider", "google_business");

    revalidatePath("/admin/integracoes");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao desconectar.";
    return { success: false, error: msg };
  }
}
