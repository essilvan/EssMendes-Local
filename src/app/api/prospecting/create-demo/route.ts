import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import {
  detectProspectingNiche,
  getNicheDemoConfig,
} from "@/utils/prospecting-niche";

function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function fetchGooglePlacePhotosAndTypes(
  placeId: string,
  apiKey: string
): Promise<{
  photos: string[];
  types: string[];
  primaryType: string | null;
}> {
  if (!placeId || !apiKey) {
    return { photos: [], types: [], primaryType: null };
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "photos,types,primaryTypeDisplayName",
        },
      }
    );
    if (!res.ok) return { photos: [], types: [], primaryType: null };
    const data = await res.json().catch(() => null);
    if (!data) return { photos: [], types: [], primaryType: null };

    const photos: string[] = (Array.isArray(data.photos) ? data.photos : [])
      .slice(0, 5)
      .map((ph: any) =>
        ph?.name
          ? `https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=1000&key=${encodeURIComponent(
              apiKey
            )}`
          : null
      )
      .filter(Boolean) as string[];

    const types: string[] = Array.isArray(data.types)
      ? data.types.filter((t: any) => typeof t === "string")
      : [];
    const primaryType = data.primaryTypeDisplayName?.text
      ? String(data.primaryTypeDisplayName.text).trim()
      : null;

    return { photos, types, primaryType };
  } catch {
    return { photos: [], types: [], primaryType: null };
  }
}

export async function POST(request: Request) {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (
      authError ||
      !authContext ||
      (!authContext.isSuperAdmin && authContext.role !== "super_admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Acesso restrito ao Super Admin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === "string" ? body.leadId.trim() : "";

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "leadId não informado." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: lead, error: leadErr } = await supabase
      .from("prospecting_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr || !lead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || "";
    let placePhotos: string[] = lead.photo_url ? [String(lead.photo_url)] : [];
    let placeTypes: string[] = Array.isArray(lead.place_types)
      ? lead.place_types
      : [];
    let primaryType: string | null = lead.primary_type || null;

    // Se ainda não temos foto real ou types salvos, busca no Google Places Details
    if ((placePhotos.length === 0 || placeTypes.length === 0) && lead.place_id && apiKey) {
      const fetched = await fetchGooglePlacePhotosAndTypes(lead.place_id, apiKey);
      if (fetched.photos.length > 0) placePhotos = fetched.photos;
      if (fetched.types.length > 0) placeTypes = fetched.types;
      if (fetched.primaryType) primaryType = fetched.primaryType;
    }

    const nicheKey = detectProspectingNiche(
      lead.business_name,
      placeTypes,
      primaryType
    );
    const nicheConfig = getNicheDemoConfig(
      nicheKey,
      lead.business_name,
      primaryType
    );

    const coverImageUrl = placePhotos[0] || nicheConfig.fallbackCoverUrl;
    const galleryPhotos =
      placePhotos.length > 0 ? placePhotos : [nicheConfig.fallbackCoverUrl];

    // Verifica se já existe um tenant para esse demo_slug (permite atualizar prévia existente!)
    let tenantId: string | null = null;
    let finalSlug = lead.demo_slug || "";

    if (finalSlug) {
      const { data: existingTenant } = await supabase
        .from("tenants")
        .select("id, slug")
        .eq("slug", finalSlug)
        .maybeSingle();

      if (existingTenant) {
        tenantId = existingTenant.id;
        finalSlug = existingTenant.slug;
      }
    }

    const tenantPayload = {
      name: lead.business_name,
      niche: nicheConfig.tenantNiche,
      theme_niche: nicheConfig.themeNiche,
      primary_color: nicheConfig.primaryColor,
      cover_image_url: coverImageUrl,
      google_place_id: lead.place_id || null,
      google_rating: lead.rating ?? 4.8,
      google_reviews_count: lead.total_reviews ?? 42,
      google_review_url: lead.place_id
        ? `https://search.google.com/local/writereview?placeid=${lead.place_id}`
        : null,
      service_fee_enabled: nicheConfig.key === "restaurant",
      service_fee_percent: 10,
      subscription_status: "trial",
      theme_settings: {
        template_id: "premium",
        niche: nicheConfig.themeNiche,
        primary_color: nicheConfig.primaryColor,
      },
    };

    if (tenantId) {
      await supabase.from("tenants").update(tenantPayload).eq("id", tenantId);
    } else {
      const baseSlug = `demo-${
        slugifyName(lead.business_name || "negocio") || "vitrine"
      }`;
      finalSlug = baseSlug;

      const { data: collision } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();

      if (collision) {
        finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const { data: createdTenant, error: tenantErr } = await supabase
        .from("tenants")
        .insert({
          ...tenantPayload,
          slug: finalSlug,
        })
        .select("id, slug")
        .single();

      if (tenantErr || !createdTenant) {
        return NextResponse.json(
          {
            success: false,
            error:
              tenantErr?.message || "Erro ao criar tenant demonstrativo.",
          },
          { status: 500 }
        );
      }

      tenantId = createdTenant.id;
      finalSlug = createdTenant.slug;
    }

    // 2. Upsert perfil da vitrine com foto real do Google Places
    await supabase.from("tenant_profiles").upsert(
      {
        tenant_id: tenantId,
        name: lead.business_name,
        description: nicheConfig.description,
        editorial_summary: nicheConfig.editorialSummary(lead.business_name),
        phone_whatsapp: lead.phone || null,
        address: lead.address || null,
        cover_image_url: coverImageUrl,
        hero_image_url: coverImageUrl,
        place_photos: galleryPhotos,
        primary_color: nicheConfig.primaryColor,
        template_id: "premium",
        rating: lead.rating ?? 4.8,
        review_count: lead.total_reviews ?? 42,
      },
      { onConflict: "tenant_id" }
    );

    // 3. Popula catálogo específico do nicho com imagens
    if (nicheConfig.key === "restaurant") {
      // Limpa itens anteriores da prévia se estiver atualizando
      await supabase.from("menu_items").delete().eq("tenant_id", tenantId);
      await supabase.from("menu_categories").delete().eq("tenant_id", tenantId);

      const uniqueCategories = Array.from(
        new Set(nicheConfig.items.map((i) => i.category))
      );
      const { data: cats } = await supabase
        .from("menu_categories")
        .insert(
          uniqueCategories.map((name, idx) => ({
            tenant_id: tenantId,
            name,
            display_order: idx + 1,
            is_active: true,
          }))
        )
        .select("id, name");

      const catMap = new Map<string, string>();
      (cats || []).forEach((c: any) => catMap.set(c.name, c.id));

      await supabase.from("menu_items").insert(
        nicheConfig.items.map((item) => ({
          tenant_id: tenantId,
          category_id: catMap.get(item.category) || null,
          category: item.category,
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          is_available: true,
        }))
      );

      const { data: existingTable } = await supabase
        .from("restaurant_tables")
        .select("id")
        .eq("tenant_id", tenantId)
        .limit(1)
        .maybeSingle();

      if (!existingTable) {
        await supabase.from("restaurant_tables").insert({
          tenant_id: tenantId,
          table_number: "01",
          name: "Mesa 01",
          is_active: true,
        });
      }
    } else {
      // Nichos não-restaurante: limpa menu de bar antigo (se houver) e popula services + tenant_products com fotos
      await supabase.from("menu_items").delete().eq("tenant_id", tenantId);
      await supabase.from("services").delete().eq("tenant_id", tenantId);
      await supabase.from("tenant_products").delete().eq("tenant_id", tenantId);

      await supabase.from("services").insert(
        nicheConfig.items.map((item) => ({
          tenant_id: tenantId,
          name: item.name,
          description: item.description,
          price: item.price,
          duration_minutes: item.duration_minutes ?? 45,
          is_active: true,
        }))
      );

      await supabase.from("tenant_products").insert(
        nicheConfig.items.map((item) => ({
          tenant_id: tenantId,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image_url: item.image_url,
          is_active: true,
        }))
      );
    }

    // 4. Atualiza lead em prospecting_leads (resiliente se colunas novas ainda não existirem)
    const nextStatus =
      lead.status === "new" || !lead.status ? "demo_created" : lead.status;
    const baseUpdate = {
      demo_slug: finalSlug,
      status: nextStatus,
    };
    const extendedUpdate = {
      ...baseUpdate,
      photo_url: placePhotos[0] || lead.photo_url || null,
      place_types: placeTypes,
      primary_type: primaryType,
      detected_niche: nicheConfig.key,
    };

    const { error: updErr } = await supabase
      .from("prospecting_leads")
      .update(extendedUpdate)
      .eq("id", lead.id);

    if (updErr && (updErr.code === "PGRST204" || /column/i.test(updErr.message))) {
      await supabase
        .from("prospecting_leads")
        .update(baseUpdate)
        .eq("id", lead.id);
    }

    return NextResponse.json({
      success: true,
      demoSlug: finalSlug,
      demoUrl: `https://${finalSlug}.essmendes.com.br`,
      niche: nicheConfig.key,
      nicheLabel: nicheConfig.label,
      coverImageUrl,
      status: nextStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro ao gerar vitrine de demonstração.",
      },
      { status: 500 }
    );
  }
}
