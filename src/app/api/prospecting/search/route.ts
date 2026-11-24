import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

interface NormalizedPlaceLead {
  place_id: string;
  business_name: string;
  phone: string;
  address: string | null;
  rating: number | null;
  total_reviews: number;
}

async function searchPlacesNewApi(
  query: string,
  apiKey: string
): Promise<NormalizedPlaceLead[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "pt-BR",
      maxResultCount: 20,
    }),
  });

  if (!res.ok) {
    throw new Error(`Places API (New) HTTP ${res.status}`);
  }

  const data = await res.json();
  const places: any[] = Array.isArray(data?.places) ? data.places : [];

  return places
    .map((p) => {
      const phone = String(
        p.nationalPhoneNumber || p.internationalPhoneNumber || ""
      ).trim();
      return {
        place_id: String(p.id || "").trim(),
        business_name: String(p.displayName?.text || "").trim(),
        phone,
        address: p.formattedAddress ? String(p.formattedAddress).trim() : null,
        rating:
          p.rating !== undefined && p.rating !== null ? Number(p.rating) : null,
        total_reviews: Number(p.userRatingCount || 0),
      };
    })
    .filter((item) => item.place_id && item.business_name && item.phone);
}

async function searchPlacesLegacyApi(
  query: string,
  apiKey: string
): Promise<NormalizedPlaceLead[]> {
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&language=pt-BR&key=${encodeURIComponent(apiKey)}`;
  const searchRes = await fetch(searchUrl);
  const searchJson = await searchRes.json();
  const results: any[] = Array.isArray(searchJson?.results)
    ? searchJson.results.slice(0, 15)
    : [];

  const detailed = await Promise.all(
    results.map(async (r) => {
      if (!r?.place_id) return null;
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        r.place_id
      )}&fields=place_id,name,formatted_address,formatted_phone_number,international_phone_number,rating,user_ratings_total&language=pt-BR&key=${encodeURIComponent(
        apiKey
      )}`;
      try {
        const dRes = await fetch(detailsUrl);
        const dJson = await dRes.json();
        const p = dJson?.result;
        if (!p) return null;
        const phone = String(
          p.formatted_phone_number || p.international_phone_number || ""
        ).trim();
        if (!phone) return null;
        return {
          place_id: String(p.place_id || r.place_id),
          business_name: String(p.name || r.name || "").trim(),
          phone,
          address: p.formatted_address || r.formatted_address || null,
          rating:
            p.rating !== undefined && p.rating !== null
              ? Number(p.rating)
              : r.rating !== undefined
              ? Number(r.rating)
              : null,
          total_reviews: Number(
            p.user_ratings_total ?? r.user_ratings_total ?? 0
          ),
        } as NormalizedPlaceLead;
      } catch {
        return null;
      }
    })
  );

  return detailed.filter(Boolean) as NormalizedPlaceLead[];
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
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query || query.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe um termo de busca (ex: Espetinho Taguatinga DF).",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "";
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Variável GOOGLE_PLACES_API_KEY não configurada no servidor.",
        },
        { status: 500 }
      );
    }

    let foundPlaces: NormalizedPlaceLead[] = [];
    try {
      foundPlaces = await searchPlacesNewApi(query, apiKey);
    } catch {
      foundPlaces = await searchPlacesLegacyApi(query, apiKey);
    }

    const supabase = createAdminClient();
    const placeIds = foundPlaces.map((p) => p.place_id);

    const existingMap = new Map<string, any>();
    if (placeIds.length > 0) {
      const { data: existingRows } = await supabase
        .from("prospecting_leads")
        .select("*")
        .in("place_id", placeIds);
      (existingRows || []).forEach((row: any) => {
        if (row?.place_id) existingMap.set(row.place_id, row);
      });
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const lead of foundPlaces) {
      const existing = existingMap.get(lead.place_id);
      if (existing) {
        await supabase
          .from("prospecting_leads")
          .update({
            business_name: lead.business_name,
            phone: lead.phone,
            address: lead.address,
            rating: lead.rating,
            total_reviews: lead.total_reviews,
          })
          .eq("id", existing.id);
        updatedCount++;
      } else {
        const { error: insErr } = await supabase
          .from("prospecting_leads")
          .insert({
            place_id: lead.place_id,
            business_name: lead.business_name,
            phone: lead.phone,
            address: lead.address,
            rating: lead.rating,
            total_reviews: lead.total_reviews,
            status: "new",
            chat_history: [],
          });
        if (!insErr) importedCount++;
      }
    }

    const { data: allLeads } = await supabase
      .from("prospecting_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({
      success: true,
      foundCount: foundPlaces.length,
      importedCount,
      updatedCount,
      leads: allLeads || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro ao buscar leads no Google Places.",
      },
      { status: 500 }
    );
  }
}
