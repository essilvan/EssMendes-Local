"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant, checkIsSuperAdmin } from "@/lib/supabase/tenant";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/utils/slugify";
import { extractNeighborhoodAndCity } from "@/utils/address";
import type { SuperAdminTenantItem } from "@/types";
import { calculateLocalPresenceScore } from "@/utils/presence-score-engine";

/**
 * Resolve URLs curtas do Google Maps (ex: maps.app.goo.gl/xxx ou goo.gl/maps/xxx)
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
    console.warn("[resolveShortGoogleMapsUrl] Erro ao resolver URL curta:", err);
    return url;
  }
}

/**
 * Retorna todos os tenants cadastrados para visualização no painel Super Admin
 */
export async function getAllTenantsForSuperAdminAction(): Promise<{
  success: boolean;
  data?: SuperAdminTenantItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    let isSuper = false;
    const userEmail = (user.email || "").toLowerCase().trim();
    if (userEmail === "essilvanmendes@gmail.com") {
      isSuper = true;
    }

    // Checa papel de super_admin na tabela profiles
    if (!isSuper) {
      try {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileRow?.role === "super_admin") {
          isSuper = true;
        }
      } catch {}
    }

    if (!isSuper) {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkIsSuperAdmin(user, tenantUser?.role)) {
        isSuper = true;
      }
    }

    if (!isSuper) {
      return { success: false, error: "Acesso restrito ao Super Admin." };
    }

    // 1. Busca todos os estabelecimentos cadastrados na tabela tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, slug, google_rating, google_reviews_count, presence_score, created_at")
      .order("created_at", { ascending: false });

    if (tenantsError) {
      return { success: false, error: `Erro ao buscar empresas: ${tenantsError.message}` };
    }

    if (!tenants || tenants.length === 0) {
      return { success: true, data: [] };
    }

    const tenantIds = tenants.map((t) => t.id);

    // 2. Busca dados de perfil vinculados (endereço, telefone, logo)
    const { data: profiles } = await supabase
      .from("tenant_profiles")
      .select("tenant_id, address, phone_whatsapp, logo_url, rating, google_rating, google_reviews_count")
      .in("tenant_id", tenantIds);

    const profileMap = new Map<string, any>();
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.tenant_id, p);
      }
    }

    // 3. Contagem de produtos cadastrados em tenant_products para cada tenant
    const { data: products } = await supabase
      .from("tenant_products")
      .select("tenant_id")
      .in("tenant_id", tenantIds);

    const productCountMap = new Map<string, number>();
    if (products) {
      for (const prod of products) {
        const current = productCountMap.get(prod.tenant_id) || 0;
        productCountMap.set(prod.tenant_id, current + 1);
      }
    }

    // 4. Mapeia para o DTO final SuperAdminTenantItem
    const tenantItems: SuperAdminTenantItem[] = tenants.map((t) => {
      const p = profileMap.get(t.id);
      const rawAddress = p?.address || "";
      const city = (t as any).city || extractNeighborhoodAndCity(rawAddress) || "Não informada";
      const phone = (t as any).phone || p?.phone_whatsapp || null;
      const logoUrl = p?.logo_url || null;
      const googleRating = t.google_rating ?? p?.google_rating ?? p?.rating ?? null;
      const googleReviews = t.google_reviews_count ?? p?.google_reviews_count ?? null;
      const totalProducts = productCountMap.get(t.id) || 0;
      const score = t.presence_score ?? 60;

      let status = "forte";
      if (score >= 80) status = "excelente";
      else if (score < 40) status = "critica";
      else if (score < 65) status = "moderada";

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        city,
        phone,
        logo_url: logoUrl,
        google_rating: googleRating,
        google_reviews_count: googleReviews,
        total_products: totalProducts,
        presence_score: score,
        status,
        created_at: t.created_at,
      };
    });

    return { success: true, data: tenantItems };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: msg };
  }
}

/**
 * Seleciona um tenant ativo para o Super Admin gerenciar em nome da empresa.
 * Armazena a seleção em cookie HTTP-Only 'em_active_tenant_id' e redireciona.
 */
export async function selectManagedTenantAction(
  tenantId: string,
  targetPath: string = "/admin/dashboard"
): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!checkIsSuperAdmin(user, tenantUser?.role)) {
      return { success: false, error: "Apenas Super Admins podem gerenciar empresas." };
    }

    // Confirma se o tenant existe
    const { data: targetTenant, error: targetError } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .maybeSingle();

    if (targetError || !targetTenant) {
      return { success: false, error: "Estabelecimento não encontrado." };
    }

    // Salva o cookie de impersonação
    const cookieStore = await cookies();
    cookieStore.set("em_active_tenant_id", tenantId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/produtos");
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/posts");
    revalidatePath("/super-admin");

    return { success: true, redirectUrl: targetPath };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao selecionar empresa";
    return { success: false, error: msg };
  }
}

/**
 * Limpa o cookie de impersonação e retorna ao painel do Super Admin
 */
export async function clearManagedTenantAction() {
  const cookieStore = await cookies();
  cookieStore.delete("em_active_tenant_id");
  revalidatePath("/admin", "layout");
  revalidatePath("/super-admin");
  redirect("/super-admin");
}

/**
 * Criação Simplificada de Estabelecimento no Super Admin:
 * Cadastra um novo tenant colando apenas o Link do Google Maps e WhatsApp.
 */
export async function createTenantFromGoogleMapsAction(
  mapsUrl: string,
  whatsapp: string
): Promise<{
  success: boolean;
  tenant?: { id: string; name: string; slug: string };
  error?: string;
}> {
  try {
    const cleanMapsUrl = mapsUrl?.trim() || "";
    const cleanWhatsapp = whatsapp?.trim() || "";

    if (!cleanMapsUrl) {
      return {
        success: false,
        error: "Por favor, informe o link do Google Maps da empresa.",
      };
    }

    if (!cleanWhatsapp) {
      return {
        success: false,
        error: "Por favor, informe o número de WhatsApp da empresa.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!checkIsSuperAdmin(user, tenantUser?.role)) {
      return { success: false, error: "Acesso restrito ao Super Admin." };
    }

    // 1. Resolve redirecionamento de URL curta (maps.app.goo.gl)
    const resolvedUrl = await resolveShortGoogleMapsUrl(cleanMapsUrl);

    let companyName = "";
    let googlePlaceId = "";
    let formattedAddress = "";
    let category = "Serviços Especializados";
    let rating: number | null = null;
    let reviewCount: number | null = null;
    let placePhotos: string[] = [];
    let latitude: number | null = null;
    let longitude: number | null = null;
    let editorialSummary = "";
    let openingHours: string[] | null = null;
    const reviewsToSave: Array<{
      author_name: string;
      rating: number;
      text: string;
      relative_time?: string;
      author_photo_url?: string;
    }> = [];

    // 1.1 Extração preliminar de Place ID na URL
    const chijMatch = resolvedUrl.match(/(ChIJ[a-zA-Z0-9_\-]{20,})/);
    if (chijMatch && chijMatch[1]) {
      googlePlaceId = chijMatch[1];
    }

    // 1.2 Extração de coordenadas na URL
    const coordsMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch && coordsMatch[1] && coordsMatch[2]) {
      latitude = parseFloat(coordsMatch[1]);
      longitude = parseFloat(coordsMatch[2]);
    }

    // 1.3 Extração de nome da URL (/place/Nome+Do+Local)
    const placeNameMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
    let searchName = "";
    if (placeNameMatch && placeNameMatch[1]) {
      searchName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, " "));
      // Se contiver vírgula (ex: "Empresa X, Rua tal"), usa a primeira parte
      if (searchName.includes(",")) {
        searchName = searchName.split(",")[0].trim();
      }
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // 2. Consulta à Google Places API se houver chave configurada
    if (apiKey) {
      try {
        let placeDetailsData: any = null;

        // Se encontrou Place ID
        if (googlePlaceId) {
          const detailsUrl = `https://places.googleapis.com/v1/places/${googlePlaceId}`;
          const fields = [
            "id",
            "displayName",
            "formattedAddress",
            "rating",
            "userRatingCount",
            "reviews",
            "editorialSummary",
            "photos",
            "primaryTypeDisplayName",
            "location",
            "regularOpeningHours",
            "currentOpeningHours",
          ].join(",");

          const detailsRes = await fetch(detailsUrl, {
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": fields,
            },
          });

          if (detailsRes.ok) {
            placeDetailsData = await detailsRes.json();
          }
        }

        // Se não obteve pelo ID direto, pesquisa por texto
        if (!placeDetailsData && (searchName || cleanMapsUrl)) {
          const searchUrl = "https://places.googleapis.com/v1/places:searchText";
          const queryText = searchName || cleanMapsUrl;
          const fields = [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.rating",
            "places.userRatingCount",
            "places.reviews",
            "places.editorialSummary",
            "places.photos",
            "places.primaryTypeDisplayName",
            "places.location",
            "places.regularOpeningHours",
            "places.currentOpeningHours",
          ].join(",");

          const searchRes = await fetch(searchUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": fields,
            },
            body: JSON.stringify({
              textQuery: queryText,
              languageCode: "pt-BR",
            }),
          });

          if (searchRes.ok) {
            const searchJson = await searchRes.json();
            if (searchJson.places && searchJson.places.length > 0) {
              placeDetailsData = searchJson.places[0];
            }
          }
        }

        // Processa dados retornados pelo Google Places
        if (placeDetailsData) {
          if (placeDetailsData.id) googlePlaceId = placeDetailsData.id;
          if (placeDetailsData.displayName?.text) {
            companyName = placeDetailsData.displayName.text;
          }
          if (placeDetailsData.formattedAddress) {
            formattedAddress = placeDetailsData.formattedAddress;
          }
          if (placeDetailsData.rating) {
            rating = parseFloat(placeDetailsData.rating);
          }
          if (placeDetailsData.userRatingCount) {
            reviewCount = parseInt(placeDetailsData.userRatingCount, 10);
          }
          if (placeDetailsData.primaryTypeDisplayName?.text) {
            category = placeDetailsData.primaryTypeDisplayName.text;
          }
          if (placeDetailsData.editorialSummary?.text) {
            editorialSummary = placeDetailsData.editorialSummary.text;
          }
          if (placeDetailsData.location) {
            latitude = placeDetailsData.location.latitude;
            longitude = placeDetailsData.location.longitude;
          }
          if (Array.isArray(placeDetailsData.photos)) {
            placePhotos = placeDetailsData.photos
              .slice(0, 8)
              .map(
                (ph: any) =>
                  `https://places.googleapis.com/v1/${ph.name}/media?maxHeightPx=800&maxWidthPx=1200&key=${apiKey}`
              );
          }
          if (Array.isArray(placeDetailsData.reviews)) {
            for (const r of placeDetailsData.reviews.slice(0, 5)) {
              reviewsToSave.push({
                author_name: r.authorAttribution?.displayName || "Cliente Google",
                rating: r.rating || 5,
                text: r.text?.text || r.originalText?.text || "",
                relative_time: r.relativePublishTimeDescription || "recentemente",
                author_photo_url: r.authorAttribution?.photoUri || null,
              });
            }
          }
          const rawHours =
            placeDetailsData.currentOpeningHours?.weekdayDescriptions ||
            placeDetailsData.regularOpeningHours?.weekdayDescriptions ||
            placeDetailsData.current_opening_hours?.weekday_text ||
            placeDetailsData.opening_hours?.weekday_text ||
            null;
          if (rawHours) {
            openingHours = rawHours;
          }
        }
      } catch (apiErr) {
        console.warn("[createTenantFromGoogleMapsAction] Erro ao consultar Places API:", apiErr);
      }
    }

    // 3. Fallbacks se a API não retornou tudo ou estiver sem chave
    if (!companyName) {
      companyName = searchName || "Novo Estabelecimento";
    }

    if (!formattedAddress) {
      formattedAddress = "Endereço a definir";
    }

    const neighborhoodCity = extractNeighborhoodAndCity(formattedAddress);
    const locationLabel = neighborhoodCity ? `em ${neighborhoodCity}` : "na sua região";
    const headline = `Especialistas em ${category.toLowerCase()} com atendimento de alta qualidade e excelência ${locationLabel}.`;

    if (!editorialSummary) {
      editorialSummary = `Bem-vindo à ${companyName}! Atendimento dedicado, confiança e produtos/serviços de alto padrão para você e sua família.`;
    }

    // 4. Criação do Tenant com slug único
    const baseSlug = slugify(companyName) || "empresa-local";
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existingSlug } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();

      if (!existingSlug) break;
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { data: newTenant, error: insertTenantError } = await supabase
      .from("tenants")
      .insert({
        name: companyName,
        slug: finalSlug,
        plan_tier: "free",
        google_rating: rating,
        google_reviews_count: reviewCount,
        google_place_id: googlePlaceId || null,
        presence_score: rating ? 75 : 55,
      })
      .select("id, name, slug")
      .single();

    if (insertTenantError || !newTenant) {
      return {
        success: false,
        error: `Erro ao criar tenant: ${insertTenantError?.message || "Falha desconhecida"}`,
      };
    }

    const tenantId = newTenant.id;

    // 5. Criação do Profile em tenant_profiles
    const logoUrl = placePhotos.length > 0 ? placePhotos[0] : null;

    const { error: profileError } = await supabase.from("tenant_profiles").insert({
      tenant_id: tenantId,
      name: companyName,
      description: headline,
      editorial_summary: editorialSummary,
      address: formattedAddress,
      phone_whatsapp: cleanWhatsapp,
      phone: cleanWhatsapp,
      logo_url: logoUrl,
      google_maps_url: cleanMapsUrl,
      google_place_id: googlePlaceId || null,
      rating: rating,
      google_rating: rating,
      review_count: reviewCount,
      google_reviews_count: reviewCount,
      business_category: category,
      opening_hours_json: openingHours,
      place_photos: placePhotos,
      latitude: latitude,
      longitude: longitude,
      template_id: "default",
      primary_color: "#0f766e",
    });

    if (profileError) {
      console.warn("[createTenantFromGoogleMapsAction] Erro ao criar perfil:", profileError);
    }

    // 6. Cadastra serviços essenciais sugeridos sob consulta
    const defaultServices = [
      {
        tenant_id: tenantId,
        name: `Atendimento / Consulta em ${category}`,
        description: "Avaliação inicial dedicada e orçamento sob medida sem compromisso.",
        duration_minutes: 45,
        price: null,
        is_active: true,
      },
      {
        tenant_id: tenantId,
        name: "Serviço Especializado Personalizado",
        description: "Execução com técnicas avançadas e garantia de satisfação.",
        duration_minutes: 60,
        price: null,
        is_active: true,
      },
    ];

    await supabase.from("services").insert(defaultServices);

    // 7. Salva avaliações reais do Google se encontradas
    if (reviewsToSave.length > 0) {
      const reviewsPayload = reviewsToSave.map((r) => ({
        tenant_id: tenantId,
        author_name: r.author_name,
        rating: r.rating,
        text: r.text,
        relative_time: r.relative_time,
        author_photo_url: r.author_photo_url,
        is_official_google: true,
      }));
      await supabase.from("tenant_reviews").insert(reviewsPayload);
    }

    // 8. Vincula o usuário atual como super_admin em tenant_users
    await supabase.from("tenant_users").insert({
      tenant_id: tenantId,
      user_id: user.id,
      role: "super_admin",
    });

    // 9. Recalcula score de presença inicial
    try {
      const { scoreResult } = calculateLocalPresenceScore({
        tenant: {
          id: tenantId,
          name: companyName,
          slug: finalSlug,
          google_rating: rating,
          google_reviews_count: reviewCount,
        },
        profile: {
          name: companyName,
          business_category: category,
          phone_whatsapp: cleanWhatsapp,
          phone: cleanWhatsapp,
          address: formattedAddress,
          description: headline,
          editorial_summary: editorialSummary,
          logo_url: logoUrl,
          place_photos: placePhotos,
          google_rating: rating,
          rating: rating,
          google_reviews_count: reviewCount,
          review_count: reviewCount,
        },
        servicesCount: 2,
        productsCount: 0,
        postsCount: 0,
        reviews: reviewsToSave.map((r, idx) => ({
          id: `temp-${idx}`,
          rating: r.rating,
          text: r.text,
          reply_text: null,
        })),
        portfolioCount: 0,
      });

      await supabase
        .from("tenants")
        .update({
          presence_score: scoreResult.totalScore,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId);
    } catch {}

    revalidatePath("/super-admin");
    revalidatePath("/admin", "layout");

    return {
      success: true,
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        slug: newTenant.slug,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao cadastrar estabelecimento";
    return { success: false, error: msg };
  }
}
